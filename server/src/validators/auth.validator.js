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

// Dùng chung cho /2fa/verify và /2fa/confirm-setup — cả 2 đều cần
// pendingToken (cấp lúc login() hoặc setup2FA()) + mã 6 số từ app xác
// thực. regex chặn luôn input không phải 6 chữ số trước khi tới service.
const twoFactorCodeSchema = z.object({
  pendingToken: z.string().min(1, 'Thiếu pendingToken'),
  code: z.string().regex(/^\d{6}$/, 'Mã xác thực phải gồm đúng 6 chữ số')
});

const twoFactorSetupSchema = z.object({
  pendingToken: z.string().min(1, 'Thiếu pendingToken')
});

module.exports = { loginSchema, twoFactorCodeSchema, twoFactorSetupSchema };
