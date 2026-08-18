// server/src/routes/auth.routes.js
//
// Route công khai (không cần authenticate) cho luồng đăng nhập/refresh/
// đăng xuất. Ba route đều map 1-1 với auth.controller.js đã có sẵn.

const express = require('express');
const { login, refresh, logout } = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/auth/login
// Không gắn validate.middleware ở đây vì auth.controller.js đã tự gọi
// loginSchema.safeParse ngay trong hàm login() — giữ nguyên hành vi hiện
// tại. Các route mới sau này nên dùng validate.middleware cho nhất quán
// thay vì validate thủ công trong controller.
router.post('/login', login);

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