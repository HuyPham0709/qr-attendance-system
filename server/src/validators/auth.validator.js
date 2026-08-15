const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ').max(254),
  password: z.string().min(1, 'Thiếu mật khẩu').max(200)
});

module.exports = { loginSchema };