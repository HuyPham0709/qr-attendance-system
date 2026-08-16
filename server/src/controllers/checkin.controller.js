const mongoose = require('mongoose');
const Attendee = require('../models/Attendee.model');
const Event = require('../models/Event.model');
const CheckInLog = require('../models/CheckInLog.model');
const { evaluateCheckIn, OUTCOMES, decodeAttendeeIdFromToken } = require('../services/checkin.service');

async function scanCheckIn(req, res) {
  try {
    const token = req.body?.token;
    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu token QR để check-in',
        result: OUTCOMES.INVALID_QR
      });
    }

    const decoded = decodeAttendeeIdFromToken(token);
    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: 'Token QR không hợp lệ',
        result: OUTCOMES.INVALID_QR,
        reason: 'malformed'
      });
    }

    const attendee = await Attendee.findById(decoded.attendeeId).select('+qrSecret');
    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người tham dự',
        result: OUTCOMES.INVALID_QR,
        reason: 'attendee_not_found'
      });
    }

    const event = await Event.findById(attendee.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện của người tham dự',
        result: OUTCOMES.INVALID_QR,
        reason: 'event_not_found'
      });
    }

    const result = evaluateCheckIn({
      token,
      attendee,
      event,
      geo: req.body?.geo,
      now: Date.now()
    });

    if (result.outcome !== OUTCOMES.SUCCESS) {
      await CheckInLog.create({
        eventId: event._id,
        attendeeId: attendee._id,
        result: result.outcome,
        scannedBy: req.user?._id,
        gate: req.body?.gate,
        deviceId: req.body?.deviceId,
        geo: req.body?.geo,
        clientTimestamp: new Date()
      });

      return res.status(400).json({
        success: false,
        message: result.message,
        result: result.outcome,
        reason: result.reason
      });
    }

    Object.assign(attendee, result.patch);
    await attendee.save();

    await CheckInLog.create({
      eventId: event._id,
      attendeeId: attendee._id,
      result: result.outcome,
      scannedBy: req.user?._id,
      gate: req.body?.gate,
      deviceId: req.body?.deviceId,
      geo: req.body?.geo,
      clientTimestamp: new Date()
    });

    return res.json({
      success: true,
      message: result.message,
      result: result.outcome,
      data: {
        attendeeId: attendee._id,
        eventId: event._id,
        checkInAt: attendee.checkIn.checkInAt
      }
    });
  } catch (error) {
    console.error('scanCheckIn error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi check-in',
      result: OUTCOMES.INVALID_QR
    });
  }
}

async function manualCheckIn(req, res) {
  try {
    const { attendeeId, eventId, gate, reason } = req.body;

    if (!attendeeId || !eventId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'attendeeId, eventId, và reason là bắt buộc'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(attendeeId)) {
      return res.status(400).json({
        success: false,
        message: 'attendeeId không hợp lệ'
      });
    }

    const attendee = await Attendee.findById(attendeeId);
    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người tham dự'
      });
    }

    const event = await Event.findById(attendee.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    const allowMultipleCheckIn = Boolean(event?.settings?.allowMultipleCheckIn);
    if (attendee.checkIn?.isCheckedIn && !allowMultipleCheckIn) {
      return res.status(400).json({
        success: false,
        message: 'Người này đã check-in rồi',
        result: OUTCOMES.DUPLICATE
      });
    }

    attendee.status = 'checked_in';
    attendee.checkIn = {
      isCheckedIn: true,
      checkInAt: new Date(),
      checkInBy: req.user._id,
      gate: gate || 'manual',
      method: 'manual',
      deviceInfo: req.body.deviceInfo
    };
    await attendee.save();

    await CheckInLog.create({
      eventId: event._id,
      attendeeId: attendee._id,
      result: OUTCOMES.SUCCESS,
      scannedBy: req.user._id,
      gate: gate || 'manual',
      deviceId: req.body.deviceId,
      clientTimestamp: new Date(),
      createdAt: new Date()
    });

    return res.json({
      success: true,
      message: `Check-in thủ công: ${reason}`,
      data: {
        attendeeId: attendee._id,
        eventId: event._id,
        checkInAt: attendee.checkIn.checkInAt
      }
    });
  } catch (error) {
    console.error('manualCheckIn error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi check-in thủ công'
    });
  }
}

module.exports = {
  scanCheckIn,
  manualCheckIn
};
