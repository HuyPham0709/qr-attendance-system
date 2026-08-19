// server/src/controllers/event.controller.js
//
// Controller cho Event CRUD operations
// - Chỉ super_admin và organizer được tạo event
// - Organizer chỉ thấy/edit event của chính mình (organizationId)

const mongoose = require('mongoose');
const Event = require('../models/Event.model');
const { ok, fail } = require('../utils/apiResponse');

/**
 * POST /api/events
 * Tạo sự kiện mới
 */
async function createEvent(req, res, next) {
  try {
    const payload = req.body;
    payload.organizationId = req.user.organizationId;

    const event = await Event.create(payload);
    return ok(res, event, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/events
 * Lấy danh sách event (phân trang)
 */
async function listEvents(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.user && req.user.role === 'organizer') {
      filter.organizationId = req.user.organizationId;
    }

    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Event.countDocuments(filter);

    return ok(res, {
      data: events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/events/:id
 * Lấy chi tiết 1 event
 */
async function getEventById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Event ID không hợp lệ', 'INVALID_ID');
    }

    const event = await Event.findById(id).lean();
    if (!event) {
      return fail(res, 404, 'Không tìm thấy sự kiện', 'EVENT_NOT_FOUND');
    }

    if (req.user && req.user.role === 'organizer' && 
        event.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền xem sự kiện này', 'FORBIDDEN');
    }

    return ok(res, event);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/events/:id
 * Cập nhật sự kiện
 */
async function updateEventById(req, res, next) {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Event ID không hợp lệ', 'INVALID_ID');
    }

    const event = await Event.findById(id);
    if (!event) {
      return fail(res, 404, 'Không tìm thấy sự kiện', 'EVENT_NOT_FOUND');
    }

    if (req.user.role === 'organizer' && 
        event.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền sửa sự kiện này', 'FORBIDDEN');
    }

    delete payload.organizationId;

    const updated = await Event.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    return ok(res, updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/events/:id
 * Xóa sự kiện (soft delete: đặt status = 'cancelled')
 */
async function deleteEventById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Event ID không hợp lệ', 'INVALID_ID');
    }

    const event = await Event.findById(id);
    if (!event) {
      return fail(res, 404, 'Không tìm thấy sự kiện', 'EVENT_NOT_FOUND');
    }

    if (req.user.role === 'organizer' && 
        event.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền xóa sự kiện này', 'FORBIDDEN');
    }

    const deleted = await Event.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    return ok(res, { message: 'Sự kiện đã bị hủy', data: deleted });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEvent,
  listEvents,
  getEventById,
  updateEventById,
  deleteEventById
};
