// server/src/validators/checkin.validator.js
const { z } = require('zod');

const geoSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const scanCheckInSchema = z.object({
  token: z.string().min(1, 'Thiếu token QR'),
  gate: z.string().trim().min(1).optional(),
  deviceId: z.string().trim().min(1).optional(),
  // geo optional ở tầng validate — evaluateCheckIn() tự quyết định có bắt
  // buộc hay không tuỳ event.settings.requireGeoFence, vì validator không
  // biết được cấu hình của event tương ứng.
  geo: geoSchema.optional(),
  // Thời điểm client thực sự quét (khác createdAt của log, hữu ích khi
  // scanner offline gửi bù sau — xem SyncQueue trong spec).
  clientTimestamp: z.coerce.date().optional()
});

const manualCheckInSchema = z.object({
  attendeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'attendeeId không hợp lệ'),
  gate: z.string().trim().min(1).optional(),
  // Bắt buộc theo mục 1.3 spec: "mọi thao tác manual check-in cần ghi log
  // kèm lý do" — chặn ngay ở tầng validate trước khi vào controller.
  reason: z.string().trim().min(3, 'Cần nhập lý do check-in thủ công (tối thiểu 3 ký tự)'),
  deviceId: z.string().trim().min(1).optional(),
  clientTimestamp: z.coerce.date().optional()
});

// Body của POST /api/checkin/sync — Scanner PWA gửi lên khi có mạng lại sau
// khi tích luỹ nhiều lượt quét offline (mục 2.2.B). Giới hạn max 1000 bản
// ghi/lần để tránh 1 request đơn lẻ kẹt quá lâu (đúng lưu ý trong
// sync.service.js: khối lượng offline thực tế chỉ vài trăm bản ghi/lần).
const syncBatchSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'eventId không hợp lệ'),
  gate: z.string().trim().min(1).optional(),
  deviceId: z.string().trim().min(1).optional(),
  records: z
    .array(
      z.object({
        token: z.string().min(1, 'Thiếu token QR'),
        clientTimestamp: z.coerce.date().optional()
      })
    )
    .min(1, 'Cần ít nhất 1 bản ghi để đồng bộ')
    .max(1000, 'Tối đa 1000 bản ghi mỗi lần đồng bộ')
});

module.exports = { scanCheckInSchema, manualCheckInSchema, syncBatchSchema };