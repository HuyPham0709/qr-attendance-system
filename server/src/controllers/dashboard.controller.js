const Event = require('../models/Event.model');
const Attendee = require('../models/Attendee.model');
const Organization = require('../models/Organization.model');
const CheckInLog = require('../models/CheckInLog.model');
const { ok, fail } = require('../utils/apiResponse');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const mongoose = require('mongoose');

async function getOrganizerStats(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return fail(res, 403, 'Organizer chưa được gán tổ chức', 'NO_ORGANIZATION');
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return fail(res, 404, 'Không tìm thấy tổ chức', 'ORGANIZATION_NOT_FOUND');
    }

    const orgEvents = await Event.find({ organizationId: orgId, status: { $ne: 'cancelled' } }).distinct('_id');

    const [
      totalRegistered,
      totalCheckedIn,
      totalRevoked,
      recentLogs
    ] = await Promise.all([
      Attendee.countDocuments({ eventId: { $in: orgEvents }, status: 'registered' }),
      Attendee.countDocuments({ eventId: { $in: orgEvents }, status: 'checked_in' }),
      Attendee.countDocuments({ eventId: { $in: orgEvents }, status: 'cancelled' }),
      CheckInLog.find({ eventId: { $in: orgEvents } })
        .populate('eventId', 'name')
        .populate('attendeeId', 'fullName')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    const attendanceRate = totalRegistered > 0 ? ((totalCheckedIn / totalRegistered) * 100).toFixed(1) : 0;

    return ok(res, {
      organizationName: org.name,
      totalRegistered,
      totalCheckedIn,
      attendanceRate: `${attendanceRate}%`,
      revokedCount: totalRevoked,
      recentActivity: recentLogs.map(log => ({
        name: log.attendeeId?.fullName || 'Unknown',
        time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString('vi-VN') : '--',
        gate: log.gate || '--',
        status: log.result === 'success' ? 'Checked-in' : log.result === 'revoked' ? 'Revoked' : log.result
      }))
    });
  } catch (err) {
    next(err);
  }
}

async function getSystemStats(req, res, next) {
  try {
    const [
      totalOrgs,
      totalEvents,
      pendingOrgs,
      lockedOrgs,
      activeOrgs
    ] = await Promise.all([
      Organization.countDocuments({ isActive: { $ne: false } }),
      Event.countDocuments({ status: { $ne: 'cancelled' } }),
      Organization.countDocuments({ status: 'pending' }),
      Organization.countDocuments({ status: 'locked' }),
      Organization.countDocuments({ status: 'active' })
    ]);

    return ok(res, {
      totalOrgs,
      totalEvents,
      pendingOrgs,
      lockedOrgs,
      activeOrgs
    });
  } catch (err) {
    next(err);
  }
}

async function getCheckinsTimeline(req, res, next) {
  try {
    const { eventId } = req.query;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return fail(res, 400, 'eventId không hợp lệ', 'INVALID_ID');
    }

    const event = await Event.findById(eventId).select('organizationId').lean();
    if (!event) {
      return fail(res, 404, 'Không tìm thấy sự kiện', 'EVENT_NOT_FOUND');
    }

    if (req.user.role === 'organizer' && 
        event.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền xem sự kiện này', 'FORBIDDEN');
    }

    if (req.user.role === 'scanner_staff') {
      return fail(res, 403, 'Bạn không có quyền xem biểu đồ', 'FORBIDDEN');
    }

    const timeline = await CheckInLog.aggregate([
      { $match: { eventId: mongoose.Types.ObjectId(eventId), result: 'success' } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          _id: 0,
          hour: '$_id',
          count: 1
        }
      }
    ]);

    return ok(res, timeline);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOrganizerStats,
  getSystemStats,
  getCheckinsTimeline
};
