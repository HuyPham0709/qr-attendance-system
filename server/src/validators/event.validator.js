// server/src/validators/event.validator.js
//
// Zod schema cho Event CRUD operations

const { z } = require('zod');

const geoSchema = z.object({
  lat: z.number().min(-90).max(90, 'Vĩ độ phải trong khoảng -90 đến 90'),
  lng: z.number().min(-180).max(180, 'Kinh độ phải trong khoảng -180 đến 180')
}).optional();

const locationSchema = z.object({
  address: z.string().trim().optional(),
  geo: geoSchema,
  geoFenceRadiusMeters: z.number().positive().optional()
}).optional();

const settingsSchema = z.object({
  allowMultipleCheckIn: z.boolean().optional(),
  requireGeoFence: z.boolean().optional(),
  qrTokenTTLMinutes: z.number().min(0).optional(),
  checkInWindowMinutes: z.number().positive().optional()
}).optional();

const gateSchema = z.object({
  name: z.string().trim().min(1, 'Tên cổng không được để trống'),
  code: z.string().trim().min(1, 'Mã cổng không được để trống').optional()
});

const eventBaseSchema = z.object({
  name: z.string().trim().min(1, 'Tên sự kiện không được để trống'),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  banner: z.string().trim().optional(),
  location: locationSchema,
  startAt: z.coerce.date().refine((d) => d > new Date(), 'Thời gian bắt đầu phải là tương lai'),
  endAt: z.coerce.date().optional(),
  status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']).optional(),
  settings: settingsSchema,
  gates: z.array(gateSchema).optional()
});

const createEventSchema = eventBaseSchema.refine(
  (data) => !data.endAt || data.endAt > data.startAt,
  'Thời gian kết thúc phải sau thời gian bắt đầu'
);

// Update schema: mọi field optional trừ không thể PATCH startAt
const updateEventSchema = eventBaseSchema.partial().omit({ startAt: true }).extend({
  startAt: z.coerce.date().optional()
});

module.exports = { createEventSchema, updateEventSchema };
