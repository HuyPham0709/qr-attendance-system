// server/src/middlewares/auth.middleware.js
//
// authenticate: đọc access token từ cookie httpOnly (ACCESS_COOKIE trong
// cookie.util.js), verify chữ ký + hạn dùng qua token.util.js, gắn
// req.user = { id, role, organizationId }.
//
// authorize(...roles): dùng SAU authenticate, chặn nếu req.user.role
// không nằm trong danh sách role cho phép. Đúng với comment TODO đã có
// sẵn trong attendee.routes.js:
//   authorize('scanner_staff', 'organizer', 'super_admin')

const { verifyAccessToken } = require('../utils/token.util');
const { ACCESS_COOKIE } = require('../utils/cookie.util');
const { fail } = require('../utils/apiResponse');
const User = require('../models/User.model');

function authenticate(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE];

  if (!token) {
    return fail(res, 401, 'Chưa đăng nhập', 'UNAUTHENTICATED');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      organizationId: payload.organizationId || null
    };
    return next();
  } catch {
    // Hết hạn hoặc chữ ký sai đều trả chung 1 lỗi — client thấy 401 thì
    // tự gọi /api/auth/refresh, không cần phân biệt lý do cụ thể.
    return fail(res, 401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 'INVALID_ACCESS_TOKEN');
  }
}

/**
 * @param  {...string} allowedRoles - vd 'super_admin', 'organizer', 'scanner_staff'
 */
function authorize(...allowedRoles) {
  return function authorizeMiddleware(req, res, next) {
    if (!req.user) {
      // Phòng hờ nếu lỡ gắn authorize() mà quên authenticate() trước đó.
      return fail(res, 401, 'Chưa đăng nhập', 'UNAUTHENTICATED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return fail(res, 403, 'Bạn không có quyền thực hiện thao tác này', 'FORBIDDEN');
    }

    return next();
  };
}

/**
 * Mục 1.3 spec: Scanner Staff "chỉ thấy sự kiện được Organizer gán".
 * authorize() ở trên chỉ check ROLE, không check scanner_staff có thực sự
 * được gán vào ĐÚNG event đang thao tác hay không — hàm này bù chỗ đó.
 *
 * Đọc `assignedEvents` trực tiếp từ DB (không đọc từ req.user/JWT payload)
 * vì access token thường sống vài phút-vài giờ; nếu Organizer gỡ gán 1
 * scanner_staff khỏi event giữa lúc token còn hạn, token cũ vẫn phải mất
 * quyền ngay ở lượt quét tiếp theo — không thể chờ token hết hạn mới hết
 * quyền.
 *
 * super_admin và organizer: chưa bị chặn ở đây (đúng phạm vi việc #3 bạn
 * yêu cầu, chỉ nói tới assignedEvents của scanner_staff). Việc organizer
 * chỉ được thao tác event thuộc organizationId của mình là một lỗ hổng
 * khác, CHƯA sửa trong lần này — ghi chú lại như 1 TODO riêng, không gộp
 * chung để tránh đoán sai phạm vi.
 *
 * @param {{id: string, role: string}} user - req.user
 * @param {string} eventId - eventId THẬT lấy từ DB (vd attendee.eventId),
 *   không dùng eventId decode thô chưa verify chữ ký, để tránh bị giả
 *   mạo qua token.
 * @returns {Promise<boolean>}
 */
async function ensureEventAccess(user, eventId) {
  if (!user || !eventId) return false;

  if (user.role === 'super_admin' || user.role === 'organizer') {
    // TODO (ngoài phạm vi sửa lần này): organizer nên bị giới hạn theo
    // event.organizationId === user.organizationId.
    return true;
  }

  if (user.role === 'scanner_staff') {
    const dbUser = await User.findById(user.id).select('assignedEvents').lean();
    if (!dbUser) return false;
    return dbUser.assignedEvents.some((assignedId) => String(assignedId) === String(eventId));
  }

  return false;
}

module.exports = { authenticate, authorize, ensureEventAccess };