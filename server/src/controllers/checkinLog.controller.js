const mongoose = require('mongoose');
const CheckInLog = require('../models/CheckInLog.model');
const Event = require('../models/Event.model');
const Attendee = require('../models/Attendee.model');
const { ok, fail } = require('../utils/apiResponse');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { listCheckInLogsSchema } = require('../validators/checkinLog.validator');

async function listCheckInLogs(req, res, next) {
  try {
    const parsed = listCheckInLogsSchema.parse(req.query);
    const page = parsed.page;
    const limit = parsed.limit;
    const skip = (page - 1) * limit;
    const { eventId, result, attendeeId } = parsed;

    const filter = {};

    if (req.user.role === 'organizer') {
      const orgEventIds = await Event.find({ organizationId: req.user.organizationId }).distinct('_id');
      filter.eventId = { $in: orgEventIds };
    }

    if (eventId) {
      filter.eventId = eventId;
    }

    if (result) {
      filter.result = result;
    }

    if (attendeeId) {
      filter.attendeeId = attendeeId;
    }

    const [logs, total] = await Promise.all([
      CheckInLog.find(filter)
        .populate('eventId', 'name')
        .populate('attendeeId', 'fullName email')
        .populate('scannedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CheckInLog.countDocuments(filter)
    ]);

    const safeLogs = logs.map(log => ({
      ...log,
      eventName: log.eventId?.name || 'Unknown Event',
      attendeeName: log.attendeeId?.fullName || 'Unknown',
      attendeeEmail: log.attendeeId?.email || '',
      scannedByName: log.scannedBy?.name || 'Unknown',
      scannedByEmail: log.scannedBy?.email || ''
    }));

    return ok(res, {
      data: safeLogs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return fail(res, 400, 'Tham số không hợp lệ', 'VALIDATION_ERROR');
    }
    next(err);
  }
}

module.exports = { listCheckInLogs };
