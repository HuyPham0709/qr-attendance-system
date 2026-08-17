const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { verifyAccessToken } = require('../utils/token.util');
const { ACCESS_COOKIE } = require('../utils/cookie.util');
const { fail } = require('../utils/apiResponse');

// Cấp bậc role dùng cho ký hiệu "organizer+", "scanner_staff+" trong API spec
const ROLE_LEVEL = {
  scanner_staff: 1,
  organizer: 2,
  super_admin: 3
};

async function authenticate(req, res, next) {
  try {
    // 1. Kiểm tra Token từ Cookie (origin/dev), nếu không có sẽ lấy từ Header (HEAD)
    let token = req.cookies?.[ACCESS_COOKIE];

    if (!token) {
      const authHeader = req.headers.authorization || '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return fail(res, 401, 'Thiếu token xác thực', 'NO_ACCESS_TOKEN');
    }

    // 2. Xác thực Token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return fail(res, 401, 'Access token không hợp lệ hoặc đã hết hạn', 'INVALID_ACCESS_TOKEN');
    }

    // 3. Query DB lấy đầy đủ trường thông tin từ cả 2 nhánh (+passwordHash, organizationId, assignedEvents)
    const user = await User.findById(payload.sub).select('+passwordHash role isActive organizationId assignedEvents');

    if (!user || !user.isActive) {
      return fail(res, 403, 'Tài khoản không còn hoạt động hoặc không hợp lệ', 'ACCOUNT_DISABLED');
    }

    // 4. Gán đầy đủ thông tin user vào request
    req.user = user;
    req.user.id = payload.sub;

    next();
  } catch (error) {
    return fail(res, 401, 'Token không hợp lệ hoặc đã hết hạn', 'INVALID_ACCESS_TOKEN');
  }
}

// Phân quyền theo danh sách role khớp chính xác (HEAD)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, 401, 'Chưa xác thực', 'NO_ACCESS_TOKEN');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return fail(res, 403, 'Bạn không có quyền truy cập chức năng này', 'FORBIDDEN');
    }

    next();
  };
}

// Phân quyền theo cấp bậc tối thiểu ROLE_LEVEL (origin/dev)
function requireRole(minRole) {
  const minLevel = ROLE_LEVEL[minRole];
  if (!minLevel) {
    throw new Error(`requireRole: role không tồn tại "${minRole}"`);
  }

  return (req, res, next) => {
    if (!req.user) {
      return fail(res, 401, 'Chưa đăng nhập', 'NO_ACCESS_TOKEN');
    }

    const userLevel = ROLE_LEVEL[req.user.role];
    if (!userLevel || userLevel < minLevel) {
      return fail(res, 403, 'Không có quyền truy cập', 'FORBIDDEN');
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
  requireRole,
  ROLE_LEVEL
};