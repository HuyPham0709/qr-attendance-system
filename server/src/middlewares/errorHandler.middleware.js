// server/src/middlewares/errorHandler.middleware.js
//
// Middleware xử lý lỗi tập trung — phải là middleware CUỐI CÙNG trong
// app.js (mount sau mọi route). Bắt lỗi từ next(err) hoặc lỗi throw ra
// trong handler async có bọc try/catch rồi next(error) (xem app.js).
//
// GHI CHÚ: bạn chưa gửi file này (không nằm trong 4 file lần này), mình
// viết mới dựa trên cách auth.controller.js đang throw lỗi. Nếu thực tế
// repo đã có bản khác, gửi lại để merge thay vì ghi đè.

const { fail } = require('../utils/apiResponse');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[errorHandler]', err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  // Lỗi 5xx: không lộ message kỹ thuật/stack ra client, chỉ log server.
  const message = status >= 500 ? 'Đã có lỗi xảy ra phía server' : err.message;
  const code = err.code || 'INTERNAL_ERROR';

  return fail(res, status, message, code);
}

module.exports = { errorHandler };