// server/src/routes/attendee.routes.js
//
// Router riêng cho các route /api/attendees/:id/...
//
// THAY ĐỔI: 2 route QR trước đây để public tạm (comment TODO cũ) vì
// auth.middleware.js chưa có trong repo. Giờ đã có, gắn theo đúng dự định
// ban đầu trong comment TODO:
// - getAttendeeQr: cho cả scanner_staff xem (cần hiển thị QR cho người
//   không quét được để check-in thủ công/đối chiếu).
// - revokeAttendeeQr: CHỈ organizer/super_admin — đây là thao tác nhạy
//   cảm (thu hồi + phát hành QR mới), không nên để scanner_staff gọi.

const express = require('express');
const { getAttendeeQr, revokeAttendeeQr } = require('../controllers/qr.controller');
const {
  registerAttendee,
  lookupTickets,
  resendQrEmail
} = require('../controllers/attendee.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { attendeePublicRateLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  registerAttendeeSchema,
  lookupTicketsSchema,
  resendQrEmailSchema
} = require('../validators/attendee.validator');

const router = express.Router();

// --- Các route PUBLIC của Attendee (mục 1.4 + 2.1 #3, #7) ---
// Không authenticate: attendee đăng ký/tra cứu không cần tài khoản.
// Có rate limit theo IP để chống spam (xem rateLimiter.middleware.js).

// POST /api/attendees/register — đăng ký công khai qua form self-registration
router.post(
  '/register',
  attendeePublicRateLimiter,
  validate(registerAttendeeSchema),
  registerAttendee
);

// GET /api/attendees/lookup?email=...&eventId=... — tra cứu lại vé bằng email
router.get(
  '/lookup',
  attendeePublicRateLimiter,
  validate(lookupTicketsSchema, 'query'),
  lookupTickets
);

// POST /api/attendees/resend — gửi lại email chứa QR
router.post(
  '/resend',
  attendeePublicRateLimiter,
  validate(resendQrEmailSchema),
  resendQrEmail
);

router.get(
  '/:id/qr',
  authenticate,
  authorize('scanner_staff', 'organizer', 'super_admin'),
  getAttendeeQr
);

router.post(
  '/:id/qr/revoke',
  authenticate,
  authorize('organizer', 'super_admin'),
  revokeAttendeeQr
);

module.exports = router;