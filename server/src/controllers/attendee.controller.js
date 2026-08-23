const mongoose = require('mongoose');
const Attendee = require('../models/Attendee.model');
const Event = require('../models/Event.model');
const TicketType = require('../models/TicketType.model');
const CheckInLog = require('../models/CheckInLog.model');
const XLSX = require('xlsx');
const { ok, fail } = require('../utils/apiResponse');
const { createAttendeeSchema, updateAttendeeSchema } = require('../validators/attendee.validator');

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
  listAttendees,
  getAttendee,
  createAttendee,
  updateAttendee,
  deleteAttendee,
  importAttendees
};
