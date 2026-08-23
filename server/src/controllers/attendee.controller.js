
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const XLSX = require('xlsx');
const Attendee = require('../models/Attendee.model');
const Event = require('../models/Event.model');
const TicketType = require('../models/TicketType.model');
const CheckInLog = require('../models/CheckInLog.model');
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

// ============================== PUBLIC ==============================

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

// ============================== ADMIN ==============================

async function listAttendees(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const { eventId, status, search } = req.query;

    const filter = {};

    if (req.user.role === 'organizer') {
      const orgEventIds = await Event.find({ organizationId: req.user.organizationId }).distinct('_id');
      if (eventId) {
        if (!orgEventIds.includes(eventId)) {
          return fail(res, 403, 'Bạn không có quyền xem attendee của event này', 'FORBIDDEN');
        }
        filter.eventId = eventId;
      } else {
        filter.eventId = { $in: orgEventIds };
      }
    } else if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return fail(res, 400, 'eventId không hợp lệ', 'INVALID_ID');
      }
      filter.eventId = eventId;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [attendees, total] = await Promise.all([
      Attendee.find(filter)
        .populate('eventId', 'name organizationId')
        .populate('ticketTypeId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendee.countDocuments(filter)
    ]);

    const safeAttendees = attendees.map(a => {
      const { qrSecret, ...rest } = a;
      return rest;
    });

    return ok(res, {
      data: safeAttendees,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
}

async function getAttendee(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Attendee ID không hợp lệ', 'INVALID_ID');
    }

    const attendee = await Attendee.findById(id)
      .populate('eventId', 'name organizationId')
      .populate('ticketTypeId', 'name')
      .lean();

    if (!attendee) {
      return fail(res, 404, 'Không tìm thấy attendee', 'ATTENDEE_NOT_FOUND');
    }

    if (req.user.role === 'organizer') {
      const eventOrgId = attendee.eventId?.organizationId || attendee.eventId;
      const event = await Event.findById(eventOrgId);
      if (!event || event.organizationId.toString() !== req.user.organizationId.toString()) {
        return fail(res, 403, 'Bạn không có quyền xem attendee này', 'FORBIDDEN');
      }
    }

    const { qrSecret, ...safeAttendee } = attendee;
    return ok(res, safeAttendee);
  } catch (err) {
    next(err);
  }
}

async function createAttendee(req, res, next) {
  try {
    const payload = req.body;
    const eventId = payload.eventId;

    const event = await Event.findById(eventId);
    if (!event) {
      return fail(res, 404, 'Không tìm thấy event', 'EVENT_NOT_FOUND');
    }

    if (req.user.role === 'organizer' && event.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền tạo attendee cho event này', 'FORBIDDEN');
    }

    if (payload.email) {
      const existing = await Attendee.findOne({
        eventId,
        email: payload.email.toLowerCase().trim()
      });
      if (existing) {
        return fail(res, 409, 'Email này đã tồn tại trong event', 'DUPLICATE_EMAIL_IN_EVENT');
      }
    }

    const attendee = await Attendee.create(payload);
    const { qrSecret, ...safeAttendee } = attendee.toObject();
    return ok(res, safeAttendee, 201);
  } catch (err) {
    next(err);
  }
}

async function updateAttendee(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Attendee ID không hợp lệ', 'INVALID_ID');
    }

    const attendee = await Attendee.findById(id);
    if (!attendee) {
      return fail(res, 404, 'Không tìm thấy attendee', 'ATTENDEE_NOT_FOUND');
    }

    const event = await Event.findById(attendee.eventId);
    if (!event) {
      return fail(res, 404, 'Không tìm thấy event của attendee', 'EVENT_NOT_FOUND');
    }

    if (req.user.role === 'organizer' && event.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền sửa attendee này', 'FORBIDDEN');
    }

    const updated = await Attendee.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    const { qrSecret, ...safeAttendee } = updated.toObject();
    return ok(res, safeAttendee);
  } catch (err) {
    next(err);
  }
}

async function deleteAttendee(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Attendee ID không hợp lệ', 'INVALID_ID');
    }

    const attendee = await Attendee.findById(id);
    if (!attendee) {
      return fail(res, 404, 'Không tìm thấy attendee', 'ATTENDEE_NOT_FOUND');
    }

    const event = await Event.findById(attendee.eventId);
    if (!event) {
      return fail(res, 404, 'Không tìm thấy event của attendee', 'EVENT_NOT_FOUND');
    }

    if (req.user.role === 'organizer' && event.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền xóa attendee này', 'FORBIDDEN');
    }

    await Attendee.findByIdAndDelete(id);
    return ok(res, { message: 'Attendee đã được xóa' });
  } catch (err) {
    next(err);
  }
}

async function importAttendees(req, res, next) {
  try {
    if (!req.file) {
      return fail(res, 400, 'Thiếu file upload', 'MISSING_FILE');
    }

    const eventId = req.body.eventId || req.query.eventId;
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return fail(res, 400, 'eventId không hợp lệ hoặc thiếu (gửi kèm trong form field eventId)', 'INVALID_EVENT_ID');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return fail(res, 404, 'Không tìm thấy event', 'EVENT_NOT_FOUND');
    }

    if (req.user.role === 'organizer' && event.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền import attendee cho event này', 'FORBIDDEN');
    }

    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } catch (err) {
      return fail(res, 400, 'Không thể đọc file Excel/CSV', 'INVALID_FILE');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawRows.length) {
      return fail(res, 400, 'File không có dữ liệu', 'EMPTY_FILE');
    }

    const existingEmails = await Attendee.find({ eventId })
      .select('email')
      .lean();
    const existingEmailSet = new Set(
      existingEmails.map(e => e.email.toLowerCase().trim())
    );

    const results = [];
    const errors = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2;

      const fullName = getCell(row, ['Họ tên', 'Họ và Tên', 'fullName', 'name', 'Name']).trim();
      const email = getCell(row, ['Email', 'email', 'E-mail']).trim().toLowerCase();
      const phone = getCell(row, ['SĐT', 'Điện thoại', 'phone', 'Phone']).trim();
      const ticketName = getCell(row, ['Loại vé', 'Loại Vé', 'ticket', 'ticketType', 'Ticket Type']).trim();
      const statusRaw = getCell(row, ['Trạng Thái', 'Status', 'status']).trim();
      const qrVersionRaw = getCell(row, ['QR Version', 'qrVersion', 'QR Version']);
      const gate = getCell(row, ['Cổng', 'Gate', 'gate']).trim();

      if (!fullName) {
        errors.push({ row: rowNum, error: 'Thiếu họ tên', data: row });
        continue;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNum, error: 'Email không hợp lệ', data: row });
        continue;
      }

      if (existingEmailSet.has(email)) {
        errors.push({ row: rowNum, error: 'Email đã tồn tại trong event', data: row });
        continue;
      }

      const statusMap = {
        'registered': 'registered', 'đã đăng ký': 'registered',
        'checked_in': 'checked_in', 'đã check-in': 'checked_in', 'đã check in': 'checked_in',
        'checked_out': 'checked_out', 'đã ra về': 'checked_out',
        'cancelled': 'cancelled', 'đã hủy': 'cancelled', 'hủy': 'cancelled',
        'no_show': 'no_show', 'vắng mặt': 'no_show'
      };
      const status = statusMap[statusRaw.toLowerCase()] || 'registered';

      let ticketTypeId;
      if (ticketName) {
        const ticketType = await TicketType.findOne({ eventId, name: ticketName }).lean();
        if (ticketType) {
          ticketTypeId = ticketType._id;
        }
      }

      const attendeeData = {
        eventId,
        fullName,
        email,
        phone: phone || undefined,
        ticketTypeId,
        status,
        qrVersion: qrVersionRaw ? Number(qrVersionRaw) : 1,
        checkIn: gate ? { gate } : undefined
      };

      try {
        const attendee = await Attendee.create(attendeeData);
        existingEmailSet.add(email);
        const { qrSecret, ...safe } = attendee.toObject();
        results.push(safe);
      } catch (err) {
        if (err.code === 11000) {
          errors.push({ row: rowNum, error: 'Email đã tồn tại trong event (race condition)', data: row });
        } else {
          errors.push({ row: rowNum, error: err.message, data: row });
        }
      }
    }

    return ok(res, {
      imported: results.length,
      failed: errors.length,
      data: results,
      errors
    });
  } catch (err) {
    next(err);
  }
}

function getCell(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return String(row[key]);
    }
  }
  return '';
}

module.exports = {
  registerAttendee,
  lookupTickets,
  resendQrEmail,
  listAttendees,
  getAttendee,
  createAttendee,
  updateAttendee,
  deleteAttendee,
  importAttendees
};
