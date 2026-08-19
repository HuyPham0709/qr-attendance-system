// server/src/validators/ticketType.validator.js
//
// Zod schema cho TicketType CRUD operations

const { z } = require('zod');

const createTicketTypeSchema = z.object({
  eventId: z.string()
    .regex(/^[a-fA-F0-9]{24}$/, 'eventId phải là MongoDB ObjectId hợp lệ (24 ký tự hex)'),
  name: z.string().trim().min(1, 'Tên loại vé không được để trống'),
  quantityLimit: z.number().positive('Số lượng tối đa phải > 0').optional(),
  price: z.number().min(0, 'Giá không được âm').optional(),
  allowedSessions: z.array(z.string()).optional()
});

// Update schema: mọi field optional trừ eventId (không cho sửa)
const updateTicketTypeSchema = createTicketTypeSchema.omit({ eventId: true }).partial();

module.exports = { createTicketTypeSchema, updateTicketTypeSchema };
