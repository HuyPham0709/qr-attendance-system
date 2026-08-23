
const { z } = require('zod');

const objectId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'ID không hợp lệ (phải là MongoDB ObjectId 24 ký tự hex)');

// --- PUBLIC ---

const registerAttendeeSchema = z.object({
  eventId: objectId,
  ticketTypeId: objectId.optional(),
  fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(120),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ').max(160),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-.\s]{8,20}$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('').transform(() => undefined))
});

const lookupTicketsSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ').max(160),
  // Không bắt buộc: cho phép tra cứu vé ở TẤT CẢ sự kiện đăng ký bằng
  // email này, hoặc thu hẹp về 1 sự kiện cụ thể nếu người dùng vào từ
  // trang sự kiện đó.
  eventId: objectId.optional()
});

const resendQrEmailSchema = z.object({
  attendeeId: objectId
});

// --- ADMIN ---

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

module.exports = {
  registerAttendeeSchema,
  lookupTicketsSchema,
  resendQrEmailSchema,
  createAttendeeSchema,
  updateAttendeeSchema
};
