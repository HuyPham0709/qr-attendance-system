const { z } = require('zod');

const auditReportSchema = z.object({
  format: z.enum(['xlsx', 'pdf']).default('xlsx'),
  eventId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  result: z.enum(['success', 'duplicate', 'invalid_qr', 'expired_qr', 'wrong_geo', 'revoked']).optional(),
  search: z.string().trim().max(160).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['to'], message: 'Khoảng ngày không hợp lệ' });
  }
});

module.exports = { auditReportSchema };
