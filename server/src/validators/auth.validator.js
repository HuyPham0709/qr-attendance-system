const { z } = require('zod');

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Email không hợp lệ')
    .max(254, 'Email không được vượt quá 254 ký tự'),
  password: z
    .string()
    .min(1, 'Thiếu mật khẩu')
    .min(6, 'Mật khẩu phải chứa tối thiểu 6 ký tự')
    .max(200, 'Mật khẩu không được vượt quá 200 ký tự')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'refreshToken không hợp lệ')
});

module.exports = {
  loginSchema,
  refreshSchema
};