const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { verifyAccessToken } = require('../utils/token.util');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Thiếu token xác thực' });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('+passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Người dùng không hợp lệ' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng này' });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize
};
