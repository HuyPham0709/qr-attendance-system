const { verifyAccessToken } = require('../utils/token.util');
const User = require('../models/User.model');
const { ACCESS_COOKIE } = require('../utils/cookie.util');
const { fail } = require('../utils/apiResponse');

// Cấp bậc role dùng cho ký hiệu "organizer+", "scanner_staff+" trong API spec:
// nghĩa là role đó trở lên. super_admin luôn đứng đầu.
const ROLE_LEVEL = {
  scanner_staff: 1,
  organizer: 2,
  super_admin: 3
};

async function authenticate(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    return fail(res, 401, 'Chưa đăng nhập', 'NO_ACCESS_TOKEN');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return fail(res, 401, 'Access token không hợp lệ hoặc đã hết hạn', 'INVALID_ACCESS_TOKEN');
  }

  // Không chỉ tin payload JWT: kiểm tra lại isActive/role hiện tại từ DB.
  // Access token sống ngắn (mặc định 15 phút) nên chi phí query này chấp nhận được,
  // đổi lại việc khoá tài khoản (isActive=false) hoặc đổi role có hiệu lực gần như
  // ngay lập tức thay vì phải đợi token cũ hết hạn.
  const user = await User.findById(payload.sub).select('role isActive organizationId assignedEvents').lean();
  if (!user || !user.isActive) {
    return fail(res, 403, 'Tài khoản không còn hoạt động', 'ACCOUNT_DISABLED');
  }

  req.user = {
    id: payload.sub,
    role: user.role,
    organizationId: user.organizationId.toString(),
    assignedEvents: user.assignedEvents
  };

  next();
}

function requireRole(minRole) {
  const minLevel = ROLE_LEVEL[minRole];
  if (!minLevel) {
    // Lỗi lập trình (gọi requireRole với tên role sai chính tả) - nên fail ngay lúc
    // định nghĩa route thay vì âm thầm cho qua lúc runtime.
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

module.exports = { authenticate, requireRole, ROLE_LEVEL };