const { z } = require('zod');

const createAttendeeSchema = z.object({
  eventId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'eventId không hợp lệ'),
  ticketTypeId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'ticketTypeId không hợp lệ').optional(),
  fullName: z.string().trim().min(1, 'Thiếu họ tên'),
  email: z.string().trim().email('Email không hợp lệ'),
  phone: z.string().trim().optional(),
  status: z.enum(['registered', 'checked_in', 'checked_out', 'cancelled', 'no_show']).default('registered'),
  customFields: z.any().optional()
});

const updateAttendeeSchema = createAttendeeSchema.partial().omit({ eventId: true });

module.exports = { createAttendeeSchema, updateAttendeeSchema };
