// server/src/sockets/index.js
//
// Đăng ký toàn bộ handler cho các socket connection. Hiện tại chỉ có 1
// luồng: client (React Admin Web dashboard — mục 2.2.B) join vào "room"
// riêng theo eventId để chỉ nhận update real-time của đúng sự kiện đang
// xem, thay vì broadcast toàn bộ cho mọi client.
//
// Auth: dùng LẠI đúng access token cookie httpOnly như REST API (không
// tạo cơ chế auth socket riêng), verify bằng verifyAccessToken — cùng 1
// nguồn sự thật với auth.middleware.js. Nếu không có cookie hợp lệ,
// disconnect ngay ở bước handshake, không cho join bất kỳ room nào.
//
// Quyền join room: dùng lại ensureEventAccess() từ auth.middleware.js —
// đúng chỗ đã sửa cho việc #3 (assignedEvents), để không có 2 nguồn xử
// lý quyền theo event lệch nhau giữa REST và socket.

const cookie = require('cookie');
const { verifyAccessToken } = require('../utils/token.util');
const { ACCESS_COOKIE } = require('../utils/cookie.util');
const { ensureEventAccess } = require('../middlewares/auth.middleware');

function authenticateSocket(socket) {
  const rawCookie = socket.handshake.headers.cookie;
  if (!rawCookie) return null;

  const parsed = cookie.parse(rawCookie);
  const token = parsed[ACCESS_COOKIE];
  if (!token) return null;

  try {
    const payload = verifyAccessToken(token);
    return {
      id: payload.sub,
      role: payload.role,
      organizationId: payload.organizationId || null
    };
  } catch {
    return null;
  }
}

/**
 * @param {import('socket.io').Server} io
 */
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    const user = authenticateSocket(socket);

    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.data.user = user;

    // Client (dashboard Organizer/Super Admin, hoặc chính Scanner PWA
    // muốn nghe đồng bộ đa cổng trong mục 2.2.B "Multi-gate ... đồng bộ
    // trạng thái chung") gửi eventId muốn theo dõi sau khi connect.
    socket.on('event:join', async (eventId, callback) => {
      try {
        const allowed = await ensureEventAccess(user, eventId);
        if (!allowed) {
          if (typeof callback === 'function') {
            callback({ ok: false, error: 'FORBIDDEN' });
          }
          return;
        }

        socket.join(`event:${eventId}`);
        if (typeof callback === 'function') {
          callback({ ok: true });
        }
      } catch (err) {
        console.error('[socket] Lỗi khi join event room:', err);
        if (typeof callback === 'function') {
          callback({ ok: false, error: 'INTERNAL_ERROR' });
        }
      }
    });

    socket.on('event:leave', (eventId) => {
      socket.leave(`event:${eventId}`);
    });
  });
}

module.exports = { registerSocketHandlers };