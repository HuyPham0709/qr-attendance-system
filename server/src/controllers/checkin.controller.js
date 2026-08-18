// server/src/controllers/checkin.controller.js
//
// Lớp orchestrator "Sprint 3" mà checkin.service.js nói tới — nối
// evaluateCheckIn() (hàm thuần) với DB thật:
//   1. decode token thô (routing) -> fetch attendee (+qrSecret) + event
//   2. gọi evaluateCheckIn() để LẤY QUYẾT ĐỊNH
//   3. nếu outcome !== success: ghi CheckInLog, trả lỗi tương ứng
//   4. nếu outcome === success: áp dụng `patch` bằng findOneAndUpdate CÓ
//      ĐIỀU KIỆN (chỉ update nếu chưa checked-in) -> đây là bước chặn
//      race condition thật sự ở tầng DB, vì khoảng thời gian giữa bước 2
//      (đọc) và bước 4 (ghi) có thể có 1 request khác xen vào.
//   5. ghi CheckInLog, cập nhật Event.stats.totalCheckedIn
//
// Không dùng Redis lock (đúng tinh thần "1 instance duy nhất, atomic
// Mongo là nguồn chống race condition duy nhất" ở mục 3-4 tài liệu spec).

const mongoose = require('mongoose');
const Attendee = require('../models/Attendee.model');
const Event = require('../models/Event.model');
const CheckInLog = require('../models/CheckInLog.model');
const { ok, fail } = require('../utils/apiResponse');
const { ensureEventAccess } = require('../middlewares/auth.middleware');
const { getIO } = require('../config/socket');
const {
  OUTCOMES,
  MESSAGES,
  decodeAttendeeIdFromToken,
  evaluateCheckIn
} = require('../services/checkin.service');

/**
 * Emit real-time cho dashboard Organizer (mục 2.2.B). Bọc try/catch
 * riêng, KHÔNG được để lỗi emit (vd io chưa init, client mất kết nối)
 * làm hỏng response check-in chính — response HTTP đã trả về đúng cho
 * scanner rồi, việc emit chỉ là "nice to have" cho dashboard xem live.
 */
function emitCheckInUpdate(eventId, payload) {
  try {
    getIO().to(`event:${eventId}`).emit('checkin:new', payload);
  } catch (err) {
    console.error('[socket] Lỗi emit checkin:new:', err);
  }
}

const OUTCOME_HTTP_STATUS = {
  [OUTCOMES.SUCCESS]: 200,
  [OUTCOMES.DUPLICATE]: 409,
  [OUTCOMES.INVALID_QR]: 400,
  [OUTCOMES.EXPIRED_QR]: 400,
  [OUTCOMES.WRONG_GEO]: 403,
  [OUTCOMES.REVOKED]: 403
};

async function writeLog({ eventId, attendeeId, result, req, gate, deviceId, clientTimestamp }) {
  // eventId/attendeeId là required:true trong CheckInLog — nếu token
  // malformed tới mức không decode được attendeeId/eventId, KHÔNG có gì
  // hợp lệ để ghi log tham chiếu tới (Mongoose sẽ reject nếu thiếu 1
  // trong 2 ref bắt buộc). Trường hợp đó chỉ log ra console, không ghi
  // DB — chấp nhận được vì bản chất là "rác" quét từ QR không hợp lệ,
  // không gắn được với attendee/event cụ thể nào để audit.
  if (!eventId || !attendeeId) {
    console.warn('[checkin] Bỏ qua ghi CheckInLog vì thiếu eventId/attendeeId (token malformed).');
    return;
  }

  try {
    await CheckInLog.create({
      eventId,
      attendeeId,
      result,
      scannedBy: req.user?.id,
      gate,
      deviceId,
      clientTimestamp
    });
  } catch (err) {
    // Ghi log thất bại không được làm hỏng response check-in chính —
    // chỉ log ra console để không mất dấu vết lỗi.
    console.error('[checkin] Lỗi ghi CheckInLog:', err);
  }
}

/**
 * POST /api/checkin/scan
 * Body (đã qua checkin.validator.js): { token, gate?, deviceId?, geo?, clientTimestamp? }
 * Role: scanner_staff, organizer, super_admin (gắn ở route)
 */
async function scanCheckIn(req, res, next) {
  try {
    const { token, gate, deviceId, geo, clientTimestamp } = req.body;

    const routing = decodeAttendeeIdFromToken(token);
    if (!routing || !mongoose.Types.ObjectId.isValid(routing.attendeeId)) {
      await writeLog({
        eventId: null,
        attendeeId: null,
        result: OUTCOMES.INVALID_QR,
        req,
        gate,
        deviceId,
        clientTimestamp
      });
      return fail(res, 400, MESSAGES[OUTCOMES.INVALID_QR], 'INVALID_QR');
    }

    // qrSecret select:false -> phải xin rõ mới lấy được, cần để verify chữ ký.
    const attendee = await Attendee.findById(routing.attendeeId).select('+qrSecret');
    const event = attendee ? await Event.findById(attendee.eventId) : null;

    // Mục 1.3: Scanner Staff "chỉ thấy sự kiện được Organizer gán". Check
    // ngay sau khi có attendee.eventId THẬT từ DB (không dùng
    // routing.eventId decode thô ở trên — giá trị đó chưa qua verify chữ
    // ký nên có thể bị giả mạo), và làm TRƯỚC evaluateCheckIn() để không
    // lộ thêm thông tin (đã hết hạn/đã check-in/...) của 1 event mà
    // scanner này vốn không có quyền động tới.
    if (attendee && !(await ensureEventAccess(req.user, attendee.eventId))) {
      return fail(
        res,
        403,
        'Bạn không được gán vào sự kiện này, không thể check-in.',
        'EVENT_NOT_ASSIGNED'
      );
    }

    const result = evaluateCheckIn({ token, attendee, event, geo, now: Date.now() });

    if (result.outcome !== OUTCOMES.SUCCESS) {
      await writeLog({
        eventId: result.eventId,
        attendeeId: result.attendeeId,
        result: result.outcome,
        req,
        gate,
        deviceId,
        clientTimestamp
      });
      return fail(res, OUTCOME_HTTP_STATUS[result.outcome], result.message, result.outcome.toUpperCase());
    }

    // --- Bước ghi atomic, chặn race condition thật sự ---
    // Điều kiện `checkIn.isCheckedIn` khác true (trừ khi event cho phép
    // check-in nhiều lần) được đưa vào chính filter của findOneAndUpdate,
    // không phải if/else sau khi đọc — đây là điểm mấu chốt để atomic:
    // nếu 2 request cùng lúc đi qua evaluateCheckIn() và cùng thấy
    // "chưa check-in", chỉ 1 trong 2 lệnh update dưới đây khớp điều kiện
    // và thắng; lệnh còn lại trả về null.
    const allowMultipleCheckIn = Boolean(event?.settings?.allowMultipleCheckIn);
    const updateFilter = { _id: attendee._id };
    if (!allowMultipleCheckIn) {
      updateFilter['checkIn.isCheckedIn'] = { $ne: true };
    }

    const updated = await Attendee.findOneAndUpdate(
      updateFilter,
      {
        $set: {
          ...result.patch,
          'checkIn.checkInBy': req.user?.id,
          'checkIn.gate': gate,
          'checkIn.deviceInfo': deviceId
        },
        $inc: { version: 1 }
      },
      { new: true }
    );

    if (!updated) {
      // Thua race: có request khác check-in trước trong khoảng giữa
      // evaluateCheckIn() (đọc) và findOneAndUpdate() (ghi) ở trên.
      await writeLog({
        eventId: result.eventId,
        attendeeId: result.attendeeId,
        result: OUTCOMES.DUPLICATE,
        req,
        gate,
        deviceId,
        clientTimestamp
      });
      return fail(res, 409, MESSAGES[OUTCOMES.DUPLICATE], 'DUPLICATE_CHECKIN');
    }

    // Không await song song với findOneAndUpdate ở trên vì totalCheckedIn
    // chỉ nên tăng khi chắc chắn update attendee thành công (tránh đếm
    // thừa nếu thua race).
    await Event.findByIdAndUpdate(event._id, { $inc: { 'stats.totalCheckedIn': 1 } });

    await writeLog({
      eventId: result.eventId,
      attendeeId: result.attendeeId,
      result: OUTCOMES.SUCCESS,
      req,
      gate,
      deviceId,
      clientTimestamp
    });

    // Emit real-time cho dashboard Organizer đang join room event này
    // (mục 2.2.B). Đặt SAU khi mọi ghi DB (attendee, stats, log) đã xong,
    // để dashboard không nhận update rồi query lại thấy dữ liệu chưa kịp
    // cập nhật.
    emitCheckInUpdate(result.eventId, {
      attendeeId: updated._id,
      fullName: updated.fullName,
      status: updated.status,
      checkIn: updated.checkIn,
      gate
    });

    return ok(res, {
      attendeeId: updated._id,
      fullName: updated.fullName,
      status: updated.status,
      checkIn: updated.checkIn
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/checkin/manual
 * Body (đã qua checkin.validator.js): { attendeeId, gate?, reason, deviceId?, clientTimestamp? }
 * Role: scanner_staff, organizer, super_admin (gắn ở route)
 *
 * Check-in thủ công KHÔNG qua QR (mục 2.1: "check-in thủ công khi không
 * quét được — QR lỗi, người quên mang"). Bỏ qua toàn bộ bước verify chữ
 * ký/geo của evaluateCheckIn() (không có token để verify), nhưng VẪN áp
 * dụng đúng cơ chế atomic chống trùng như luồng quét QR, và BẮT BUỘC ghi
 * `manualReason` — đúng yêu cầu mục 1.3: "mọi thao tác manual check-in
 * cần ghi log kèm lý do và hiển thị riêng cho Organizer review" (chống
 * nhân viên soát vé check-in khống cho người quen).
 */
async function manualCheckIn(req, res, next) {
  try {
    const { attendeeId, gate, reason, deviceId, clientTimestamp } = req.body;

    const attendee = await Attendee.findById(attendeeId);
    if (!attendee) {
      return fail(res, 404, 'Không tìm thấy attendee', 'ATTENDEE_NOT_FOUND');
    }

    const event = await Event.findById(attendee.eventId);
    if (!event) {
      return fail(res, 404, 'Không tìm thấy event của attendee này', 'EVENT_NOT_FOUND');
    }

    // Mục 1.3, tương tự scanCheckIn ở trên — check-in thủ công KHÔNG có
    // xác thực chữ ký QR nào cả, nên nếu thiếu check này, 1 scanner_staff
    // có thể check-in khống cho attendee ở BẤT KỲ event nào chỉ cần biết
    // attendeeId (rủi ro cao hơn cả luồng quét QR).
    if (!(await ensureEventAccess(req.user, event._id))) {
      return fail(
        res,
        403,
        'Bạn không được gán vào sự kiện này, không thể check-in.',
        'EVENT_NOT_ASSIGNED'
      );
    }

    if (attendee.status === 'cancelled') {
      await writeLog({
        eventId: event._id,
        attendeeId: attendee._id,
        result: OUTCOMES.REVOKED,
        req,
        gate,
        deviceId,
        clientTimestamp
      });
      return fail(res, 403, 'Vé này đã bị huỷ.', 'REVOKED');
    }

    const allowMultipleCheckIn = Boolean(event.settings?.allowMultipleCheckIn);
    const updateFilter = { _id: attendee._id };
    if (!allowMultipleCheckIn) {
      updateFilter['checkIn.isCheckedIn'] = { $ne: true };
    }

    const updated = await Attendee.findOneAndUpdate(
      updateFilter,
      {
        $set: {
          status: 'checked_in',
          'checkIn.isCheckedIn': true,
          'checkIn.checkInAt': new Date(),
          'checkIn.checkInBy': req.user?.id,
          'checkIn.gate': gate,
          'checkIn.method': 'manual',
          'checkIn.manualReason': reason,
          'checkIn.deviceInfo': deviceId
        },
        $inc: { version: 1 }
      },
      { new: true }
    );

    if (!updated) {
      await writeLog({
        eventId: event._id,
        attendeeId: attendee._id,
        result: OUTCOMES.DUPLICATE,
        req,
        gate,
        deviceId,
        clientTimestamp
      });
      return fail(res, 409, MESSAGES[OUTCOMES.DUPLICATE], 'DUPLICATE_CHECKIN');
    }

    await Event.findByIdAndUpdate(event._id, { $inc: { 'stats.totalCheckedIn': 1 } });

    await writeLog({
      eventId: event._id,
      attendeeId: attendee._id,
      result: OUTCOMES.SUCCESS,
      req,
      gate,
      deviceId,
      clientTimestamp
    });

    emitCheckInUpdate(String(event._id), {
      attendeeId: updated._id,
      fullName: updated.fullName,
      status: updated.status,
      checkIn: updated.checkIn,
      gate
    });

    return ok(res, {
      attendeeId: updated._id,
      fullName: updated.fullName,
      status: updated.status,
      checkIn: updated.checkIn
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { scanCheckIn, manualCheckIn };