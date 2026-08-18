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
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

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