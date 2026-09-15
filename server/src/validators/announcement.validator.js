// server/src/validators/announcement.validator.js
//
// Zod schema cho Announcement CRUD operations

const { z } = require('zod');

const objectId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'eventId phải là MongoDB ObjectId hợp lệ (24 ký tự hex)');

const createAnnouncementSchema = z.object({
  eventId: objectId,
  title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(150, 'Tiêu đề tối đa 150 ký tự'),
  body: z.string().trim().min(1, 'Nội dung không được để trống').max(2000, 'Nội dung tối đa 2000 ký tự'),
  isPinned: z.boolean().optional()
});

// Update: mọi field optional trừ eventId (không cho đổi thông báo sang event khác)
const updateAnnouncementSchema = createAnnouncementSchema.omit({ eventId: true }).partial();

const listAnnouncementsQuerySchema = z.object({
  eventId: objectId.optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

module.exports = { createAnnouncementSchema, updateAnnouncementSchema, listAnnouncementsQuerySchema };
