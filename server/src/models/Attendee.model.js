const mongoose = require('mongoose');
const { generateQrSecret, generateQRToken } = require('../services/qrEngine.service');

const attendeeSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType' },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  qrCode: { type: String, unique: true, index: true },
  qrSecret: { type: String, select: false },
  qrVersion: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['registered', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
    default: 'registered',
    index: true
  },
  checkIn: {
    isCheckedIn: { type: Boolean, default: false },
    checkInAt: Date,
    checkInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gate: String,
    method: { type: String, enum: ['qr_scan', 'manual', 'kiosk'] },
    deviceInfo: String
  },
  version: { type: Number, default: 0 },
  customFields: mongoose.Schema.Types.Mixed
}, { timestamps: true });

attendeeSchema.index({ eventId: 1, email: 1 }, { unique: true });
attendeeSchema.index({ eventId: 1, status: 1 });

// --- Sinh qrSecret + qrCode riêng cho từng attendee ngay khi tạo mới ---
//
// Vì sao đặt ở đây (model hook) thay vì trong controller tạo attendee:
// bất kể attendee được tạo qua đường nào (form đăng ký đơn lẻ của Thành
// viên A, import Excel hàng loạt, admin tạo tay, hay seed script), cơ chế
// sinh QR luôn nhất quán và không thể bị quên ở 1 nhánh code nào đó.
//
// - qrSecret: random 32 bytes riêng cho từng attendee, không bao giờ trả
//   về client (select: false), dùng làm lớp bảo mật thứ 2 khi ký HMAC.
// - qrCode: token "gốc" (ttl=0, không hết hạn) sinh 1 lần lúc tạo, lưu lại
//   để dùng làm nội dung QR mặc định cho các event KHÔNG bật rotating QR,
//   và để đính kèm trong email xác nhận đăng ký (Thành viên A).
//   Với event có bật rotating QR (settings.qrTokenTTLMinutes > 0), API
//   GET /attendees/:id/qr sẽ tự sinh token mới mỗi lần gọi thay vì dùng
//   field này — xem qr.controller.js.
//
// dùng pre('validate') chứ không phải pre('save') vì _id đã tồn tại ngay
// khi document được khởi tạo (new Attendee()), nên validate-time là đủ
// sớm và vẫn chạy trước khi các validator required khác của field kiểm tra.
// LƯU Ý: mongoose bản đang dùng trong repo này (9.x) không còn hỗ trợ
// kiểu middleware callback `function (next) { ...; next(); }` — hook giờ
// chỉ chạy đúng khi khai báo KHÔNG có tham số next (sync, hoặc return
// Promise/dùng async nếu cần await). Khai báo có next() như style mongoose
// 6/7/8 cũ sẽ ném lỗi "next is not a function" vì kareem không còn truyền
// next vào nữa. Toàn bộ logic bên dưới là sync (crypto thuần) nên không
// cần async.
attendeeSchema.pre('validate', function () {
  // Nếu thiếu eventId (vd validate fail vì required), bỏ qua — để
  // Mongoose tự báo lỗi "eventId is required" như bình thường, không
  // che mất lỗi đó bằng 1 exception khác từ .toString() trên undefined.
  if (this.isNew && this.eventId) {
    if (!this.qrSecret) {
      this.qrSecret = generateQrSecret();
    }
    if (!this.qrCode) {
      this.qrCode = generateQRToken({
        attendeeId: this._id.toString(),
        eventId: this.eventId.toString(),
        qrSecret: this.qrSecret,
        version: this.qrVersion || 1,
        ttlMinutes: 0
      });
    }
  }
});

module.exports = mongoose.model('Attendee', attendeeSchema);