// server/src/controllers/ticketType.controller.js
//
// Controller cho TicketType CRUD operations
// - Chỉ organizer của event + super_admin được tạo/sửa/xóa vé

const mongoose = require('mongoose');
const TicketType = require('../models/TicketType.model');
const Event = require('../models/Event.model');
const { ok, fail } = require('../utils/apiResponse');

/**
 * POST /api/ticket-types
 * Tạo loại vé mới
 */
async function createTicketType(req, res, next) {
  try {
    const payload = req.body;
    const { eventId } = payload;

    // Kiểm tra event có tồn tại không
    const event = await Event.findById(eventId);
    if (!event) {
      return fail(res, 404, 'Không tìm thấy sự kiện', 'EVENT_NOT_FOUND');
    }

    // Organizer chỉ được tạo vé cho event của mình
    if (req.user.role === 'organizer' && 
        event.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền tạo vé cho sự kiện này', 'FORBIDDEN');
    }

    const ticketType = await TicketType.create(payload);
    return ok(res, ticketType, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ticket-types
 * Lấy danh sách vé (filter theo eventId query param)
 */
async function listTicketTypes(req, res, next) {
  try {
    const { eventId } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = {};

    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return fail(res, 400, 'eventId không hợp lệ', 'INVALID_ID');
      }
      filter.eventId = eventId;

      // Organizer: check quyền truy cập event
      if (req.user && req.user.role === 'organizer') {
        const event = await Event.findById(eventId);
        if (!event || event.organizationId.toString() !== req.user.organizationId.toString()) {
          return fail(res, 403, 'Bạn không có quyền xem vé của sự kiện này', 'FORBIDDEN');
        }
      }
    }

    const ticketTypes = await TicketType.find(filter)
      .populate('eventId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await TicketType.countDocuments(filter);

    return ok(res, {
      data: ticketTypes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ticket-types/:id
 * Lấy chi tiết 1 loại vé
 */
async function getTicketTypeById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Ticket Type ID không hợp lệ', 'INVALID_ID');
    }

    const ticketType = await TicketType.findById(id).populate('eventId', 'name organizationId').lean();
    if (!ticketType) {
      return fail(res, 404, 'Không tìm thấy loại vé', 'TICKET_TYPE_NOT_FOUND');
    }

    // Organizer: check quyền
    if (req.user && req.user.role === 'organizer' && 
        ticketType.eventId.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền xem vé này', 'FORBIDDEN');
    }

    return ok(res, ticketType);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/ticket-types/:id
 * Cập nhật loại vé
 */
async function updateTicketTypeById(req, res, next) {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Ticket Type ID không hợp lệ', 'INVALID_ID');
    }

    const ticketType = await TicketType.findById(id).populate('eventId', 'organizationId');
    if (!ticketType) {
      return fail(res, 404, 'Không tìm thấy loại vé', 'TICKET_TYPE_NOT_FOUND');
    }

    // Organizer: check quyền
    if (req.user.role === 'organizer' && 
        ticketType.eventId.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền sửa vé này', 'FORBIDDEN');
    }

    // Không cho sửa eventId
    delete payload.eventId;

    const updated = await TicketType.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    return ok(res, updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/ticket-types/:id
 * Xóa loại vé
 */
async function deleteTicketTypeById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Ticket Type ID không hợp lệ', 'INVALID_ID');
    }

    const ticketType = await TicketType.findById(id).populate('eventId', 'organizationId');
    if (!ticketType) {
      return fail(res, 404, 'Không tìm thấy loại vé', 'TICKET_TYPE_NOT_FOUND');
    }

    // Organizer: check quyền
    if (req.user.role === 'organizer' && 
        ticketType.eventId.organizationId.toString() !== req.user.organizationId.toString()) {
      return fail(res, 403, 'Bạn không có quyền xóa vé này', 'FORBIDDEN');
    }

    await TicketType.findByIdAndDelete(id);
    return ok(res, { message: 'Loại vé đã được xóa' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTicketType,
  listTicketTypes,
  getTicketTypeById,
  updateTicketTypeById,
  deleteTicketTypeById
};
