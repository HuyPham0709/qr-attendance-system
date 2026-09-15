// server/src/routes/announcement.routes.js
//
// Router cho Announcement — thông báo Organizer đăng cho 1 sự kiện.
// GET public (client-attendee đọc không cần đăng nhập), ghi chỉ
// organizer/super_admin — cùng convention với event.routes.js /
// ticketType.routes.js.

const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createAnnouncementSchema,
  updateAnnouncementSchema
} = require('../validators/announcement.validator');
const {
  createAnnouncement,
  listAnnouncements,
  getAnnouncementById,
  updateAnnouncementById,
  deleteAnnouncementById
} = require('../controllers/announcement.controller');

const router = express.Router();

// GET /api/announcements?eventId=... - public
router.get('/', listAnnouncements);

// GET /api/announcements/:id - public
router.get('/:id', getAnnouncementById);

// POST /api/announcements - chỉ organizer/super_admin
router.post(
  '/',
  authenticate,
  authorize('organizer', 'super_admin'),
  validate(createAnnouncementSchema),
  createAnnouncement
);

// PATCH /api/announcements/:id - chỉ organizer/super_admin
router.patch(
  '/:id',
  authenticate,
  authorize('organizer', 'super_admin'),
  validate(updateAnnouncementSchema),
  updateAnnouncementById
);

// DELETE /api/announcements/:id - chỉ organizer/super_admin
router.delete(
  '/:id',
  authenticate,
  authorize('organizer', 'super_admin'),
  deleteAnnouncementById
);

module.exports = router;
