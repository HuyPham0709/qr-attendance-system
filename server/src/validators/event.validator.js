const { z } = require('zod');

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

const eventSchema = z.object({
  organizationId: z.string().regex(objectIdPattern, 'organizationId không hợp lệ'),
  name: z.string().trim().min(3, 'name tối thiểu 3 ký tự'),
  description: z.string().trim().optional(),
  banner: z.string().url('banner phải là URL hợp lệ').optional().or(z.literal('')),
  location: z.object({
    address: z.string().trim().optional(),
    geo: z.object({
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional()
    }).optional(),
    geoFenceRadiusMeters: z.number().min(0).optional()
  }).optional(),
  startAt: z.string().or(z.date()).transform((value) => new Date(value)),
  endAt: z.string().or(z.date()).transform((value) => new Date(value)),
  status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']).default('draft'),
  settings: z.object({
    allowMultipleCheckIn: z.boolean().default(false),
    requireGeoFence: z.boolean().default(false),
    qrTokenTTLMinutes: z.number().min(0).default(0),
    checkInWindowMinutes: z.number().min(0).default(60)
  }).default({
    allowMultipleCheckIn: false,
    requireGeoFence: false,
    qrTokenTTLMinutes: 0,
    checkInWindowMinutes: 60
  }),
  gates: z.array(z.object({
    name: z.string().trim().min(1, 'gates[].name là bắt buộc'),
    code: z.string().trim().min(1, 'gates[].code là bắt buộc')
  })).default([])
}).superRefine((data, ctx) => {
  if (data.startAt.getTime() >= data.endAt.getTime()) {
    ctx.addIssue({
      code: 'custom',
      path: ['endAt'],
      message: 'endAt phải lớn hơn startAt'
    });
  }
});

function validateEventInput(payload) {
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message
      }))
    };
  }

  return {
    valid: true,
    data: parsed.data
  };
}

module.exports = {
  eventSchema,
  validateEventInput
};
