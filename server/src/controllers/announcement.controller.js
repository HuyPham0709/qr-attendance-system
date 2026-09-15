// server/src/controllers/announcement.controller.js
//
// Controller cho Announcement (thông báo Organizer đăng cho 1 sự kiện)
// - GET: public, Attendee xem không cần đăng nhập (client-attendee gọi
//   endpoint này ở trang Thông báo)
// - POST/PATCH/DELETE: chỉ organizer của event đó + super_admin

const mongoose = require('mongoose');
const Announcement = require('../models/Announcement.model');
const Event = require('../models/Event.model');
const { ok, fail } = require('../utils/apiResponse');

/**
 * Dùng chung cho create/update/delete: load event, chặn nếu event không
 * tồn tại hoặc organizer không phải chủ event đó (cùng cách event.controller.js
 * và ticketType.controller.js đang check quyền).
 */
async function loadEventOrFail(res, eventId, user) {
  const event = await Event.findById(eventId).lean();
  if (!event) {
    fail(res, 404, 'Không tìm thấy sự kiện', 'EVENT_NOT_FOUND');
    return null;
  }
  if (user.role === 'organizer' && event.organizationId.toString() !== user.organizationId.toString()) {
    fail(res, 403, 'Bạn không có quyền thao tác thông báo của sự kiện này', 'FORBIDDEN');
    return null;
  }
  return event;
}

/**
 * POST /api/announcements
 * Organizer/super_admin đăng thông báo mới cho 1 sự kiện
 */
async function createAnnouncement(req, res, next) {
  try {
    const { eventId } = req.body;

    const event = await loadEventOrFail(res, eventId, req.user);
    if (!event) return; // response đã được gửi trong loadEventOrFail

    const announcement = await Announcement.create({
      ...req.body,
      createdBy: req.user.id
    });

    return ok(res, announcement, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/announcements?eventId=...
 * Public — Attendee xem thông báo của 1 sự kiện. Không truyền eventId sẽ
 * trả về thông báo mới nhất của TẤT CẢ sự kiện (ít dùng ở client hiện tại,
 * nhưng để ngỏ cho trang Thông báo tổng hợp sau này).
 */
async function listAnnouncements(req, res, next) {
  try {
    const { eventId } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return fail(res, 400, 'eventId không hợp lệ', 'INVALID_ID');
      }
      filter.eventId = eventId;
    }

    const announcements = await Announcement.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Announcement.countDocuments(filter);

    return ok(res, {
      data: announcements,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/announcements/:id
 */
async function getAnnouncementById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Announcement ID không hợp lệ', 'INVALID_ID');
    }

    const announcement = await Announcement.findById(id).lean();
    if (!announcement) {
      return fail(res, 404, 'Không tìm thấy thông báo', 'ANNOUNCEMENT_NOT_FOUND');
    }

    return ok(res, announcement);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/announcements/:id
 */
async function updateAnnouncementById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Announcement ID không hợp lệ', 'INVALID_ID');
    }

    const existing = await Announcement.findById(id);
    if (!existing) {
      return fail(res, 404, 'Không tìm thấy thông báo', 'ANNOUNCEMENT_NOT_FOUND');
    }

    const event = await loadEventOrFail(res, existing.eventId, req.user);
    if (!event) return;

    const updated = await Announcement.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    return ok(res, updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/announcements/:id
 */
async function deleteAnnouncementById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'Announcement ID không hợp lệ', 'INVALID_ID');
    }

    const existing = await Announcement.findById(id);
    if (!existing) {
      return fail(res, 404, 'Không tìm thấy thông báo', 'ANNOUNCEMENT_NOT_FOUND');
    }

    const event = await loadEventOrFail(res, existing.eventId, req.user);
    if (!event) return;

    await Announcement.findByIdAndDelete(id);
    return ok(res, { message: 'Thông báo đã được xóa' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAnnouncement,
  listAnnouncements,
  getAnnouncementById,
  updateAnnouncementById,
  deleteAnnouncementById
};
