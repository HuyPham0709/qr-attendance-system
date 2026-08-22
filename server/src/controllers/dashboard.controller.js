const Event = require('../models/Event.model');
const Attendee = require('../models/Attendee.model');
const Organization = require('../models/Organization.model');
const CheckInLog = require('../models/CheckInLog.model');
const { ok, fail } = require('../utils/apiResponse');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

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

    const orgEvents = await Event.find({ organizationId: orgId }).distinct('_id');

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
      Organization.countDocuments(),
      Event.countDocuments(),
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

module.exports = {
  getOrganizerStats,
  getSystemStats
};
