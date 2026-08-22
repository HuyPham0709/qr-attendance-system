const { z } = require('zod');

const listCheckInLogsSchema = z.object({
  eventId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  result: z.enum(['success', 'duplicate', 'invalid_qr', 'expired_qr', 'wrong_geo', 'revoked']).optional(),
  attendeeId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

module.exports = { listCheckInLogsSchema };
