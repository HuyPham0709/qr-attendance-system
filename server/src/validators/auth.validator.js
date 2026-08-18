// server/src/validators/auth.validator.js
//
// File này trước đó RỖNG (0 dòng) trong repo bạn gửi -> auth.controller.js
// destructure { loginSchema } ra `undefined`, rồi gọi
// `loginSchema.safeParse(req.body)` (dòng 7) crash ngay với đúng lỗi bạn
// thấy: "Cannot read properties of undefined (reading 'safeParse')".
// Không phải lỗi liên quan tới Socket.io/rate limit/assignedEvents đã sửa
// ở lượt trước - route /api/auth/login vốn dĩ chưa từng chạy được.

const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(1, 'Thiếu mật khẩu')
});

module.exports = { loginSchema };
