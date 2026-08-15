const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
// Không bắt buộc authenticate ở đây: logout phải hoạt động ngay cả khi
// accessToken đã hết hạn nhưng refreshToken vẫn còn - miễn có refresh cookie là revoke được.
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;