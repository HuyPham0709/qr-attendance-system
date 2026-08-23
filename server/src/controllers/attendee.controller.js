// server/src/controllers/attendee.controller.js
//
// 3 endpoint PUBLIC (không authenticate) phục vụ Attendee — mục 1.4 + 2.1
// (#3 self-registration, #7 tra cứu vé & gửi lại email) của bản kiến trúc.
// Chỉ làm phần CORE, KHÔNG làm phần nâng cao (không Wallet, không SMS,
// không rotating-QR cho các trang public này — event mặc định
// qrTokenTTLMinutes=0 nên QR không đổi qua các lần xem, đúng hành vi
// "không rotating" mặc định của toàn hệ thống).
//
// Atomic ticket-limit enforcement dùng đúng công thức trong spec mục 5.4:
//   findOneAndUpdate({ _id, $expr: { $lt: ['$quantitySold','$quantityLimit'] } }, { $inc: { quantitySold: 1 } })
// quantityLimit === null/undefined -> vé không giới hạn, bỏ qua điều kiện.

const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Attendee = require('../models/Attendee.model');
const Event = require('../models/Event.model');
const TicketType = require('../models/TicketType.model');
const { sendTicketQrEmail } = require('../services/email.service');
const { ok, fail } = require('../utils/apiResponse');

const REGISTRABLE_STATUSES = ['published', 'ongoing'];

/** Trả về QR dưới dạng data URL từ token đã lưu sẵn trên attendee (không rotating). */
async function toQrDataUrl(qrToken) {
  return QRCode.toDataURL(qrToken, { margin: 1, width: 320 });
}

/** Định dạng lại 1 attendee sang shape an toàn để trả về public (không lộ qrSecret, version nội bộ...). */
function toPublicAttendee(attendee) {
  return {
    id: attendee._id,
    fullName: attendee.fullName,
    email: attendee.email,
    phone: attendee.phone || null,
    status: attendee.status,
    isCheckedIn: Boolean(attendee.checkIn?.isCheckedIn),
    checkInAt: attendee.checkIn?.checkInAt || null,
    event: attendee.eventId && typeof attendee.eventId === 'object'
      ? {
          id: attendee.eventId._id,
          name: attendee.eventId.name,
          startAt: attendee.eventId.startAt,
          endAt: attendee.eventId.endAt,
          address: attendee.eventId.location?.address || null,
          status: attendee.eventId.status
        }
      : { id: attendee.eventId },
    ticketType: attendee.ticketTypeId && typeof attendee.ticketTypeId === 'object'
      ? { id: attendee.ticketTypeId._id, name: attendee.ticketTypeId.name }
      : null
  };
}

/**
 * POST /api/attendees/register
 * Đăng ký công khai (không cần tài khoản). Body đã qua validate middleware
 * (registerAttendeeSchema): eventId, ticketTypeId?, fullName, email, phone?.
 */
async function registerAttendee(req, res, next) {
  const { eventId, ticketTypeId, fullName, email, phone } = req.body;
  let reservedTicketType = null; // dùng để rollback $inc nếu tạo Attendee thất bại phía sau

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return fail(res, 404, 'Không tìm thấy sự kiện', 'EVENT_NOT_FOUND');
    }
    if (!REGISTRABLE_STATUSES.includes(event.status)) {
      return fail(
        res,
        409,
        'Sự kiện hiện không mở đăng ký (chưa công bố, đã kết thúc hoặc đã huỷ).',
        'EVENT_NOT_OPEN'
      );
    }

    if (ticketTypeId) {
      const ticketType = await TicketType.findById(ticketTypeId);
      if (!ticketType || String(ticketType.eventId) !== String(eventId)) {
        return fail(res, 400, 'Loại vé không hợp lệ cho sự kiện này', 'TICKET_TYPE_NOT_FOUND');
      }

      if (ticketType.quantityLimit != null) {
        // Atomic: chỉ tăng quantitySold nếu vẫn còn chỗ tại đúng thời điểm
        // update -> loại race condition khi nhiều người đăng ký cùng lúc
        // giành vé cuối cùng (xem giải thích trong TicketType.model.js).
        reservedTicketType = await TicketType.findOneAndUpdate(
          { _id: ticketTypeId, $expr: { $lt: ['$quantitySold', '$quantityLimit'] } },
          { $inc: { quantitySold: 1 } },
          { new: true }
        );
        if (!reservedTicketType) {
          return fail(res, 409, 'Loại vé này đã hết chỗ.', 'TICKET_SOLD_OUT');
        }
      } else {
        reservedTicketType = await TicketType.findByIdAndUpdate(
          ticketTypeId,
          { $inc: { quantitySold: 1 } },
          { new: true }
        );
      }
    }

    let attendee;
    try {
      attendee = await Attendee.create({
        eventId,
        ticketTypeId: reservedTicketType ? reservedTicketType._id : undefined,
        fullName,
        email,
        phone
      });
    } catch (err) {
      // Rollback phần vé đã giữ chỗ ở bước trên nếu tạo attendee thất bại,
      // nếu không quantitySold sẽ bị "kẹt" cao hơn thực tế mãi mãi.
      if (reservedTicketType) {
        await TicketType.findByIdAndUpdate(ticketTypeId, { $inc: { quantitySold: -1 } });
      }
      if (err.code === 11000) {
        return fail(
          res,
          409,
          'Email này đã đăng ký sự kiện này rồi. Dùng chức năng "Tra cứu vé" để xem lại vé.',
          'ALREADY_REGISTERED'
        );
      }
      throw err;
    }

    // Best-effort, không chặn response nếu event.stats update lỗi.
    Event.findByIdAndUpdate(eventId, { $inc: { 'stats.totalRegistered': 1 } }).catch((err) =>
      console.error('[attendee.controller] Không cập nhật được stats.totalRegistered:', err)
    );

    const qrDataUrl = await toQrDataUrl(attendee.qrCode);

    let emailResult = { devMode: true };
    try {
      emailResult = await sendTicketQrEmail({
        event,
        attendee,
        qrDataUrl,
        subjectPrefix: 'Vé tham dự'
      });
    } catch (err) {
      // Đăng ký vẫn coi là THÀNH CÔNG dù gửi email lỗi (vé đã tạo trong
      // DB) — người dùng vẫn thấy QR ngay trên trang kết quả và có thể
      // tự "Gửi lại email" sau. Chỉ log lỗi để Organizer/dev biết SMTP có
      // vấn đề.
      console.error('[attendee.controller] Gửi email QR thất bại:', err);
    }

    return ok(
      res,
      {
        attendee: toPublicAttendee({ ...attendee.toObject(), eventId: event, ticketTypeId: reservedTicketType }),
        qrDataUrl,
        emailSent: !emailResult.devMode
      },
      201
    );
  } catch (err) {
    if (reservedTicketType) {
      TicketType.findByIdAndUpdate(ticketTypeId, { $inc: { quantitySold: -1 } }).catch(() => {});
    }
    next(err);
  }
}

/**
 * GET /api/attendees/lookup?email=...&eventId=...
 * Tra cứu lại vé đã đăng ký bằng email (mục 2.1.7) — không cần tài khoản.
 * eventId là optional: bỏ trống để xem TẤT CẢ vé đã đăng ký bằng email đó.
 */
async function lookupTickets(req, res, next) {
  try {
    const { email, eventId } = req.query;
    const filter = { email };
    if (eventId) filter.eventId = eventId;

    const attendees = await Attendee.find(filter)
      .populate('eventId', 'name startAt endAt location status')
      .populate('ticketTypeId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const data = await Promise.all(
      attendees.map(async (a) => ({
        ...toPublicAttendee(a),
        qrDataUrl: a.status === 'cancelled' ? null : await toQrDataUrl(a.qrCode)
      }))
    );

    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendees/resend
 * Gửi lại email chứa QR (mục 2.1.7: "resend khi gửi thất bại/mất email").
 * Body: { attendeeId } — attendeeId lấy từ kết quả GET /lookup, không cần
 * đăng nhập vì đã tra cứu bằng email trước đó rồi mới thấy được id này.
 */
async function resendQrEmail(req, res, next) {
  try {
    const { attendeeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(attendeeId)) {
      return fail(res, 400, 'attendeeId không hợp lệ', 'INVALID_ID');
    }

    const attendee = await Attendee.findById(attendeeId);
    if (!attendee) {
      return fail(res, 404, 'Không tìm thấy vé', 'ATTENDEE_NOT_FOUND');
    }
    if (attendee.status === 'cancelled') {
      return fail(res, 409, 'Vé này đã bị huỷ, không thể gửi lại.', 'TICKET_CANCELLED');
    }

    const event = await Event.findById(attendee.eventId);
    if (!event) {
      return fail(res, 404, 'Không tìm thấy sự kiện của vé này', 'EVENT_NOT_FOUND');
    }

    const qrDataUrl = await toQrDataUrl(attendee.qrCode);
    const emailResult = await sendTicketQrEmail({
      event,
      attendee,
      qrDataUrl,
      subjectPrefix: 'Gửi lại vé'
    });

    return ok(res, { emailSent: !emailResult.devMode, qrDataUrl });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerAttendee, lookupTickets, resendQrEmail };
