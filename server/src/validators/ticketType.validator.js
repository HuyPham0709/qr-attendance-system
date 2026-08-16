const z = require('zod');

const ticketTypeSchema = z.object({
  eventId: z.string().trim().min(1, 'eventId là bắt buộc'),
  name: z.string().trim().min(1, 'Tên loại vé là bắt buộc').max(100),
  quantityLimit: z.number().int().min(0, 'Số lượng không thể âm').optional().nullable(),
  price: z.number().min(0, 'Giá không thể âm').default(0),
  allowedSessions: z.array(z.string()).default([])
});

const createTicketTypeSchema = ticketTypeSchema;
const updateTicketTypeSchema = ticketTypeSchema.partial();

function validateTicketTypeInput(payload = {}) {
  const result = createTicketTypeSchema.safeParse(payload);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message
    }));
    return { valid: false, errors, data: null };
  }

  return { valid: true, errors: [], data: result.data };
}

function validateTicketTypeUpdate(payload = {}) {
  const result = updateTicketTypeSchema.safeParse(payload);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message
    }));
    return { valid: false, errors, data: null };
  }

  return { valid: true, errors: [], data: result.data };
}

module.exports = {
  createTicketTypeSchema,
  updateTicketTypeSchema,
  validateTicketTypeInput,
  validateTicketTypeUpdate
};
