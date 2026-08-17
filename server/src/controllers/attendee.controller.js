const mongoose = require('mongoose');
const Attendee = require('../models/Attendee.model');
const Event = require('../models/Event.model');
const { validateAttendeeRegistration, buildAttendeeQuery } = require('../services/attendee.service');

async function registerAttendee(req, res) {
  try {
    const parsed = validateAttendeeRegistration(req.body);

    if (!parsed.valid) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đăng ký không hợp lệ',
        errors: parsed.errors
      });
    }

    const event = await Event.findById(parsed.data.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện để đăng ký'
      });
    }

    if (req.user && req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đăng ký attendee cho sự kiện này'
      });
    }

    const existing = await Attendee.findOne({ eventId: parsed.data.eventId, email: parsed.data.email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Người này đã đăng ký cho sự kiện này'
      });
    }

    const attendee = await Attendee.create(parsed.data);

    return res.status(201).json({
      success: true,
      data: attendee
    });
  } catch (error) {
    console.error('registerAttendee error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi đăng ký attendee'
    });
  }
}

async function listAttendees(req, res) {
  try {
    const query = buildAttendeeQuery({
      eventId: req.query.eventId,
      status: req.query.status,
      search: req.query.search
    });

    const attendees = await Attendee.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: attendees
    });
  } catch (error) {
    console.error('listAttendees error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách attendee'
    });
  }
}

async function getAttendeeById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'attendeeId không hợp lệ' });
    }

    const attendee = await Attendee.findById(id);
    if (!attendee) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy attendee' });
    }

    return res.json({ success: true, data: attendee });
  } catch (error) {
    console.error('getAttendeeById error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Lỗi khi lấy attendee' });
  }
}

async function updateAttendeeById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'attendeeId không hợp lệ'
      });
    }

    const attendee = await Attendee.findById(id);
    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy attendee để cập nhật'
      });
    }

    const event = await Event.findById(attendee.eventId);
    if (req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật attendee này'
      });
    }

    const updateFields = {};
    if (req.body.fullName) updateFields.fullName = String(req.body.fullName).trim();
    if (req.body.phone) updateFields.phone = String(req.body.phone).trim();
    if (req.body.status) updateFields.status = req.body.status;
    if (req.body.customFields) updateFields.customFields = req.body.customFields;

    Object.assign(attendee, updateFields);
    await attendee.save();

    return res.json({
      success: true,
      data: attendee
    });
  } catch (error) {
    console.error('updateAttendeeById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật attendee'
    });
  }
}

async function deleteAttendeeById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'attendeeId không hợp lệ'
      });
    }

    const attendee = await Attendee.findById(id);
    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy attendee để xóa'
      });
    }

    const event = await Event.findById(attendee.eventId);
    if (req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa attendee này'
      });
    }

    attendee.status = 'cancelled';
    await attendee.save();

    return res.json({
      success: true,
      message: 'Attendee đã được chuyển sang trạng thái cancelled'
    });
  } catch (error) {
    console.error('deleteAttendeeById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa attendee'
    });
  }
}

module.exports = {
  registerAttendee,
  listAttendees,
  getAttendeeById,
  updateAttendeeById,
  deleteAttendeeById
};
