// server/src/routes/checkin.routes.js
const express = require('express');
const { scanCheckIn, manualCheckIn } = require('../controllers/checkin.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { scanCheckInSchema, manualCheckInSchema } = require('../validators/checkin.validator');
const { scanRateLimiter } = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

// Cả 2 route đều cần đăng nhập. Việc "chỉ thấy/thao tác được sự kiện
// được Organizer gán" (mục 1.3) giờ được check ở tầng controller qua
// ensureEventAccess() (auth.middleware.js) — PHẢI ở controller chứ không
// thể ở middleware route tại đây, vì eventId của /scan chỉ biết được sau
// khi decode token trong controller (route không có :eventId param).
//
// Rate limiter theo IP+deviceId (mục 2.2.A) chỉ gắn ở /scan — đây là
// route brute-force quét thử token có ý nghĩa (không cần đăng nhập bằng
// tài khoản khác để thử nhiều token). /manual không cần vì đã bị chặn
// bởi require đăng nhập + assignedEvents, không phải mục tiêu brute-force
// đoán mã.
router.post(
  '/scan',
  authenticate,
  authorize('scanner_staff', 'organizer', 'super_admin'),
  scanRateLimiter,
  validate(scanCheckInSchema),
  scanCheckIn
);
router.post(
  '/manual',
  authenticate,
  authorize('scanner_staff', 'organizer', 'super_admin'),
  validate(manualCheckInSchema),
  manualCheckIn
);

module.exports = router;
