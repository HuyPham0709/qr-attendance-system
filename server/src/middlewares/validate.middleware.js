// server/src/middlewares/validate.middleware.js
//
// Middleware factory dùng chung cho toàn bộ route: nhận vào 1 zod schema,
// validate 1 phần cụ thể của request (body/query/params), và:
//   - Hợp lệ: gán lại req[part] = dữ liệu đã qua schema.parse (đã được
//     zod coerce/transform, vd string -> number, trim...), rồi next().
//   - Không hợp lệ: trả 400 theo đúng format apiResponse.fail() mà
//     auth.controller.js đang dùng, kèm danh sách lỗi theo từng field để
//     client (React Admin / Scanner PWA) hiển thị lỗi đúng dòng.
//
// Dùng chung cho mọi validator sau này (event.validator.js,
// attendee.validator.js...), không chỉ riêng auth.
//
// GHI CHÚ: mình gọi fail(res, 400, message, code, details) với 5 tham số.
// auth.controller.js hiện chỉ gọi fail() với 4 tham số (không có details).
// Nếu apiResponse.js hiện tại chưa nhận tham số thứ 5, JS sẽ không lỗi gì
// (tham số dư bị bỏ qua) nhưng phần "details" sẽ không tới được client.
// Gửi mình nội dung utils/apiResponse.js để mình xác nhận/chỉnh cho khớp.

const { fail } = require('../utils/apiResponse');

/**
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body' | 'query' | 'params'} [part='body']
 */
function validate(schema, part = 'body') {
  return function validateMiddleware(req, res, next) {
    const parsed = schema.safeParse(req[part]);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || part,
        message: issue.message
      }));

      return fail(res, 400, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', details);
    }

    // Ghi đè bằng dữ liệu đã qua zod (đã coerce/transform/default) thay vì
    // dùng req[part] gốc, để controller phía sau không cần tự parse lại.
    req[part] = parsed.data;
    next();
  };
}

module.exports = { validate };