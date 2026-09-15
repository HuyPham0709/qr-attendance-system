// server/src/services/sync.service.js
//
// Xử lý hàng đợi SyncQueue (mục 2.2.B "offline-first bắt buộc" trong docx +
// ghi chú README_FIX.md: "sync.service.js chưa được viết"). Khi Scanner PWA
// mất mạng, mỗi lượt quét được lưu tạm ở CLIENT (IndexedDB) kèm token + gate
// + deviceId + clientTimestamp thật lúc quét. Khi có mạng lại, client POST
// toàn bộ batch lên /api/checkin/sync (routes/checkin.routes.js +
// controllers/sync.controller.js) — batch được ghi vào SyncQueue TRƯỚC (để
// không mất dữ liệu nếu xử lý nửa chừng bị crash/mất mạng lần nữa), sau đó
// processPendingRecords() dưới đây duyệt TUẦN TỰ từng bản ghi 'pending' của
// đúng event đó, chạy qua ĐÚNG logic evaluateCheckIn() + atomic update dùng
// chung với checkin.controller.js#scanCheckIn — để không tồn tại 2 luồng
// quyết định check-in lệch nhau giữa online và offline-sync.
//
// Không dùng BullMQ/Redis (đúng quyết định đã ghi trong docx mục 5.5): khối
// lượng đồng bộ offline thường chỉ vài trăm bản ghi/lần — vòng lặp for...of
// tuần tự trong Node.js xử lý đủ nhanh (dưới 1–2 giây).

const mongoose = require('mongoose');
const SyncQueue = require('../models/SyncQueue.model');
const Attendee = require('../models/Attendee.model');
const Event = require('../models/Event.model');
const CheckInLog = require('../models/CheckInLog.model');
const { getIO } = require('../config/socket');
const { OUTCOMES, decodeAttendeeIdFromToken, evaluateCheckIn } = require('./checkin.service');

/** Giống hệt emitCheckInUpdate() trong checkin.controller.js — tách riêng ở
 * đây vì sync.service.js không import ngược controller (tránh phụ thuộc
 * vòng), nhưng PHẢI emit cùng 1 event name 'checkin:new' với cùng shape
 * payload để dashboard Organizer không cần biết bản ghi tới từ đâu (quét
 * trực tiếp hay đồng bộ offline). */
function emitCheckInUpdate(eventId, payload) {
  try {
    getIO().to(`event:${eventId}`).emit('checkin:new', payload);
  } catch (err) {
    console.error('[sync.service] Lỗi emit checkin:new:', err);
  }
}

/**
 * Ghi CheckInLog cho 1 kết quả xử lý — không throw ra ngoài để 1 lỗi ghi log
 * không làm hỏng cả batch đang xử lý tuần tự.
 */
async function writeLog({ eventId, attendeeId, result, gate, deviceId, clientTimestamp, scannedBy }) {
  if (!eventId || !attendeeId) {
    console.warn('[sync.service] Bỏ qua ghi CheckInLog vì thiếu eventId/attendeeId (token malformed).');
    return;
  }
  try {
    await CheckInLog.create({ eventId, attendeeId, result, scannedBy, gate, deviceId, clientTimestamp });
  } catch (err) {
    console.error('[sync.service] Lỗi ghi CheckInLog:', err);
  }
}

/**
 * Xử lý ĐÚNG 1 bản ghi SyncQueue — cùng logic quyết định + cùng bước ghi
 * atomic với luồng online. Khác luồng online ở chỗ không có req.user trực
 * tiếp; `scannedBy` được truyền vào từ người đã POST batch lên (xác thực ở
 * tầng controller gọi hàm này).
 *
 * @returns {{status: 'processed'|'failed', outcome: string, message: string}}
 */
async function processOneRecord(record, { scannedBy } = {}) {
  const routing = decodeAttendeeIdFromToken(record.token);
  if (!routing || !mongoose.Types.ObjectId.isValid(routing.attendeeId)) {
    return { status: 'failed', outcome: OUTCOMES.INVALID_QR, message: 'Token không decode được (malformed).' };
  }

  const attendee = await Attendee.findById(routing.attendeeId).select('+qrSecret');
  const event = attendee ? await Event.findById(attendee.eventId) : null;

  const result = evaluateCheckIn({
    token: record.token,
    attendee,
    event,
    // Quan trọng: dùng đúng thời điểm quét THẬT lúc offline (clientTimestamp),
    // không dùng Date.now() lúc đồng bộ — nếu không, 1 vé quét lúc 18:00 offline
    // nhưng mãi 20:00 mới có mạng để sync sẽ bị đánh dấu check-in lúc 20:00,
    // sai lệch dữ liệu audit thật.
    now: record.clientTimestamp ? new Date(record.clientTimestamp).getTime() : Date.now()
  });

  if (result.outcome !== OUTCOMES.SUCCESS) {
    if (result.eventId && result.attendeeId) {
      await writeLog({
        eventId: result.eventId,
        attendeeId: result.attendeeId,
        result: result.outcome,
        gate: record.gate,
        deviceId: record.deviceId,
        clientTimestamp: record.clientTimestamp,
        scannedBy
      });
    }
    return { status: 'failed', outcome: result.outcome, message: result.message };
  }

  // --- Bước ghi atomic, chặn race condition — giống hệt scanCheckIn ---
  // Trường hợp thật có thể xảy ra: người này VỪA được check-in qua đường
  // /scan trực tuyến ở gate khác trong lúc batch offline này đang chờ đồng
  // bộ -> filter điều kiện dưới đây đảm bảo không ghi đè, trả về null.
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
        'checkIn.checkInBy': scannedBy,
        'checkIn.gate': record.gate,
        'checkIn.deviceInfo': record.deviceId
      },
      $inc: { version: 1 }
    },
    { new: true }
  );

  if (!updated) {
    await writeLog({
      eventId: result.eventId,
      attendeeId: result.attendeeId,
      result: OUTCOMES.DUPLICATE,
      gate: record.gate,
      deviceId: record.deviceId,
      clientTimestamp: record.clientTimestamp,
      scannedBy
    });
    return {
      status: 'failed',
      outcome: OUTCOMES.DUPLICATE,
      message: 'Đã được check-in ở nơi khác trước khi đồng bộ kịp.'
    };
  }

  // Không await song song với findOneAndUpdate ở trên — cùng lý do đã ghi
  // trong checkin.controller.js: chỉ tăng totalCheckedIn khi chắc chắn
  // update attendee thành công.
  await Event.findByIdAndUpdate(event._id, { $inc: { 'stats.totalCheckedIn': 1 } });

  await writeLog({
    eventId: result.eventId,
    attendeeId: result.attendeeId,
    result: OUTCOMES.SUCCESS,
    gate: record.gate,
    deviceId: record.deviceId,
    clientTimestamp: record.clientTimestamp,
    scannedBy
  });

  // Emit SAU khi mọi ghi DB đã xong — cùng nguyên tắc với checkin.controller.js.
  emitCheckInUpdate(String(event._id), {
    attendeeId: updated._id,
    fullName: updated.fullName,
    status: updated.status,
    checkIn: updated.checkIn,
    gate: record.gate,
    source: 'offline_sync' // đánh dấu để dashboard phân biệt được nếu cần (không bắt buộc dùng)
  });

  return { status: 'processed', outcome: OUTCOMES.SUCCESS, message: 'OK' };
}

/**
 * Duyệt tuần tự toàn bộ bản ghi 'pending' của 1 event, ưu tiên theo
 * clientTimestamp (thời điểm quét THẬT) rồi mới tới createdAt (thời điểm
 * ghi vào SyncQueue) — vì 2 scanner có thể ở 2 gate offline khác nhau, đồng
 * bộ lệch giờ nhau, nhưng thứ tự check-in thật phải theo lúc quét.
 *
 * @param {string} eventId
 * @param {{ scannedBy?: string }} [opts]
 * @returns {Promise<{ total:number, processed:number, failed:number, results:Array }>}
 */
async function processPendingRecords(eventId, { scannedBy } = {}) {
  const pending = await SyncQueue.find({ eventId, status: 'pending' }).sort({
    clientTimestamp: 1,
    createdAt: 1
  });

  const summary = { total: pending.length, processed: 0, failed: 0, results: [] };

  for (const record of pending) {
    let outcome;
    try {
      outcome = await processOneRecord(record, { scannedBy });
    } catch (err) {
      console.error('[sync.service] Lỗi xử lý 1 bản ghi SyncQueue:', err);
      outcome = { status: 'failed', outcome: 'internal_error', message: err.message };
    }

    record.status = outcome.status;
    record.processResult = `${outcome.outcome}: ${outcome.message}`;
    await record.save();

    summary[outcome.status] += 1;
    summary.results.push({ syncQueueId: record._id, token: record.token, ...outcome });
  }

  return summary;
}

module.exports = { processOneRecord, processPendingRecords };
