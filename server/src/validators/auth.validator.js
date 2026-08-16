const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().email('email không hợp lệ'),
  password: z.string().min(6, 'password tối thiểu 6 ký tự')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'refreshToken không hợp lệ')
});

module.exports = {
  loginSchema,
  refreshSchema
};
