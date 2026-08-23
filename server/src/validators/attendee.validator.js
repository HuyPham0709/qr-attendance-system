// server/src/validators/attendee.validator.js
//
// Zod schema cho các endpoint PUBLIC của Attendee (spec mục 1.4 + 2.1):
// - Đăng ký công khai qua form self-registration (không cần tài khoản)
// - Tra cứu vé bằng email + gửi lại email QR
//
// Đây là input do người lạ trên Internet gửi lên (không qua authenticate),
// nên validate chặt hơn 1 chút so với các validator nội bộ (vd trim mọi
// chuỗi, giới hạn độ dài field để tránh payload rác/spam).

const { z } = require('zod');

const objectId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'ID không hợp lệ (phải là MongoDB ObjectId 24 ký tự hex)');

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

module.exports = { registerAttendeeSchema, lookupTicketsSchema, resendQrEmailSchema };
