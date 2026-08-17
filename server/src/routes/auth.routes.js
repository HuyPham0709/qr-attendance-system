const express = require('express');
const { login, refresh, logout, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);

// Không bắt buộc authenticate ở đây: logout phải hoạt động ngay cả khi
// accessToken đã hết hạn nhưng refreshToken vẫn còn - miễn có refresh cookie là revoke được.
router.post('/logout', logout);

// Route lấy thông tin cá nhân (origin/dev)
router.get('/me', authenticate, me);

module.exports = router;