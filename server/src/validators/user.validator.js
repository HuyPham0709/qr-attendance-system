const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Thiếu tên'),
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  role: z.enum(['super_admin', 'organizer', 'scanner_staff']).default('scanner_staff'),
  organizationId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'organizationId không hợp lệ').optional(),
  assignedEvents: z.array(z.string().regex(/^[a-fA-F0-9]{24}$/)).optional()
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  role: z.enum(['super_admin', 'organizer', 'scanner_staff']).optional(),
  isActive: z.boolean().optional(),
  assignedEvents: z.array(z.string().regex(/^[a-fA-F0-9]{24}$/)).optional()
});

module.exports = { createUserSchema, updateUserSchema };
