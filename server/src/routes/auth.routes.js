// server/src/routes/auth.routes.js
//
// Route công khai (không cần authenticate) cho luồng đăng nhập/refresh/
// đăng xuất. Ba route đều map 1-1 với auth.controller.js đã có sẵn.

const express = require('express');
const { login, verify2FA, setup2FA, confirmSetup2FA, refresh, logout } = require('../controllers/auth.controller');
const { twoFactorRateLimiter } = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

// POST /api/auth/login
// Không gắn validate.middleware ở đây vì auth.controller.js đã tự gọi
// loginSchema.safeParse ngay trong hàm login() — giữ nguyên hành vi hiện
// tại. Các route mới sau này nên dùng validate.middleware cho nhất quán
// thay vì validate thủ công trong controller.
router.post('/login', login);

// --- 2FA thật (TOTP) — thay cho luồng cũ so sánh cứng '123456' ở FE ---
// Cả 3 route đều PUBLIC (không authenticate bằng cookie) vì tại thời
// điểm gọi, user CHƯA có accessToken — họ chỉ có pendingToken cấp từ
// /login, tự thân pendingToken đã đóng vai trò xác thực cho các route
// này (xem verifyTwoFactorPendingToken trong token.util.js).
router.post('/2fa/verify', twoFactorRateLimiter, verify2FA);
router.post('/2fa/setup', setup2FA);
router.post('/2fa/confirm-setup', twoFactorRateLimiter, confirmSetup2FA);

// POST /api/auth/refresh
// Không nhận body — refresh token lấy từ cookie httpOnly (REFRESH_COOKIE),
// không cần validate.
router.post('/refresh', refresh);

// POST /api/auth/logout
router.post('/logout', logout);

module.exports = router;

// NHẮC: sau khi thêm file này, nhớ mount vào app.js:
//   const authRoutes = require('./routes/auth.routes');
//   app.use('/api/auth', authRoutes);
// Hiện app.js bạn gửi chưa mount route này.