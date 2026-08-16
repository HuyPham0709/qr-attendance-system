const mongoose = require('mongoose');
const TicketType = require('../models/TicketType.model');
const Event = require('../models/Event.model');
const { validateTicketTypePayload, buildTicketTypeQuery } = require('../services/ticketType.service');

async function createTicketType(req, res) {
  try {
    const result = validateTicketTypePayload(req.body);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu loại vé không hợp lệ',
        errors: result.errors
      });
    }

    const event = await Event.findById(result.data.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện này'
      });
    }

    if (req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tạo loại vé cho sự kiện này'
      });
    }

    const ticketType = await TicketType.create(result.data);

    return res.status(201).json({
      success: true,
      data: ticketType
    });
  } catch (error) {
    console.error('createTicketType error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo loại vé'
    });
  }
}

async function getTicketTypes(req, res) {
  try {
    const query = buildTicketTypeQuery({
      eventId: req.query.eventId,
      search: req.query.search
    });

    if (!query.eventId) {
      return res.status(400).json({
        success: false,
        message: 'Phải cung cấp eventId để lấy danh sách loại vé'
      });
    }

    const event = await Event.findById(query.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    if (req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem loại vé của sự kiện này'
      });
    }

    const ticketTypes = await TicketType.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: ticketTypes
    });
  } catch (error) {
    console.error('getTicketTypes error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách loại vé'
    });
  }
}

async function getTicketTypeById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ticketTypeId không hợp lệ'
      });
    }

    const ticketType = await TicketType.findById(id);
    if (!ticketType) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy loại vé'
      });
    }

    const event = await Event.findById(ticketType.eventId);
    if (req.user.role !== 'super_admin' && event && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem loại vé này'
      });
    }

    return res.json({
      success: true,
      data: ticketType
    });
  } catch (error) {
    console.error('getTicketTypeById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy loại vé'
    });
  }
}

async function updateTicketTypeById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ticketTypeId không hợp lệ'
      });
    }

    const ticketType = await TicketType.findById(id);
    if (!ticketType) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy loại vé để cập nhật'
      });
    }

    const event = await Event.findById(ticketType.eventId);
    if (req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật loại vé này'
      });
    }

    const result = validateTicketTypePayload({
      ...ticketType.toObject(),
      ...req.body
    });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu cập nhật không hợp lệ',
        errors: result.errors
      });
    }

    Object.assign(ticketType, result.data);
    await ticketType.save();

    return res.json({
      success: true,
      data: ticketType
    });
  } catch (error) {
    console.error('updateTicketTypeById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật loại vé'
    });
  }
}

async function deleteTicketTypeById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ticketTypeId không hợp lệ'
      });
    }

    const ticketType = await TicketType.findById(id);
    if (!ticketType) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy loại vé để xóa'
      });
    }

    const event = await Event.findById(ticketType.eventId);
    if (req.user.role !== 'super_admin' && String(event.organizationId) !== String(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa loại vé này'
      });
    }

    await TicketType.deleteOne({ _id: id });

    return res.json({
      success: true,
      message: 'Loại vé đã được xóa'
    });
  } catch (error) {
    console.error('deleteTicketTypeById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa loại vé'
    });
  }
}

module.exports = {
  createTicketType,
  getTicketTypes,
  getTicketTypeById,
  updateTicketTypeById,
  deleteTicketTypeById
};
