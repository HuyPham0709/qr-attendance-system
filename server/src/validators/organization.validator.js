const { z } = require('zod');

const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, 'Thiếu tên tổ chức'),
  slug: z.string().trim().min(1, 'Thiếu slug'),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
  status: z.enum(['active', 'pending', 'locked']).default('active'),
  ownerEmail: z.string().trim().email('Email không hợp lệ').optional()
});

const updateOrganizationSchema = createOrganizationSchema.partial().omit({ slug: true });

module.exports = { createOrganizationSchema, updateOrganizationSchema };
