const mongoose = require('mongoose');
const Event = require('../models/Event.model');
const Attendee = require('../models/Attendee.model');
const { validateEventPayload, buildEventQuery } = require('../services/event.service');
const { validateEventInput } = require('../validators/event.validator');

function slugify(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function generateUniqueSlug(baseName) {
  const base = slugify(baseName) || 'event';
  let slug = base;
  let suffix = 1;

  while (await Event.exists({ slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function createEvent(req, res) {
  try {
    const result = validateEventInput(req.body);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu sự kiện không hợp lệ',
        errors: result.errors
      });
    }

    const payload = result.data;
    payload.organizationId = req.user?.organizationId || payload.organizationId;
    payload.slug = payload.slug || (await generateUniqueSlug(payload.name));

    const event = await Event.create(payload);

    return res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('createEvent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo sự kiện'
    });
  }
}

async function getEvents(req, res) {
  try {
    const query = buildEventQuery({
      organizationId: req.user?.role === 'super_admin' ? req.query.organizationId : req.user?.organizationId,
      status: req.query.status,
      search: req.query.search
    });

    const events = await Event.find(query).sort({ startAt: -1 });

    return res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('getEvents error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách sự kiện'
    });
  }
}

async function getEventById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'eventId không hợp lệ'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    if (req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem sự kiện này'
      });
    }

    return res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('getEventById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy sự kiện'
    });
  }
}

async function updateEventById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'eventId không hợp lệ'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện để cập nhật'
      });
    }

    if (req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật sự kiện này'
      });
    }

    const payload = { ...req.body };

    if (payload.name && payload.name !== event.name) {
      payload.slug = payload.slug || (await generateUniqueSlug(payload.name));
    }

    const result = validateEventInput({
      ...event.toObject(),
      ...payload,
      organizationId: payload.organizationId || event.organizationId
    });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu cập nhật không hợp lệ',
        errors: result.errors
      });
    }

    Object.assign(event, result.data);
    await event.save();

    return res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('updateEventById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật sự kiện'
    });
  }
}

async function deleteEventById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'eventId không hợp lệ'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện để xóa'
      });
    }

    if (req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa sự kiện này'
      });
    }

    event.status = 'cancelled';
    await event.save();

    return res.json({
      success: true,
      message: 'Sự kiện đã được chuyển sang trạng thái cancelled',
      data: event
    });
  } catch (error) {
    console.error('deleteEventById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa sự kiện'
    });
  }
}

async function getEventStats(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'eventId không hợp lệ'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    if (req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thống kê sự kiện này'
      });
    }

    const totalAttendees = await Attendee.countDocuments({ eventId: id });
    const checkedInCount = await Attendee.countDocuments({ eventId: id, 'checkIn.isCheckedIn': true });
    const cancelledCount = await Attendee.countDocuments({ eventId: id, status: 'cancelled' });

    const attendeesByStatus = await Attendee.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return res.json({
      success: true,
      data: {
        eventId: event._id,
        eventName: event.name,
        totalRegistered: totalAttendees,
        totalCheckedIn: checkedInCount,
        totalCancelled: cancelledCount,
        checkInPercentage: totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0,
        attendeesByStatus
      }
    });
  } catch (error) {
    console.error('getEventStats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thống kê sự kiện'
    });
  }
}

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEventById,
  deleteEventById,
  getEventStats
};
