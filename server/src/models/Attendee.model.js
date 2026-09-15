const mongoose = require('mongoose');
const crypto = require('crypto');
const { generateQrSecret, generateQRToken } = require('../services/qrEngine.service');

// Bảng chữ cái để sinh mã vé cho người đọc — bỏ các ký tự dễ nhầm khi đọc
// bằng mắt/đọc miệng cho nhân viên hỗ trợ: 0/O, 1/I/L.
const TICKET_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generateTicketCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += TICKET_CODE_ALPHABET[bytes[i] % TICKET_CODE_ALPHABET.length];
  }
  return code;
}

const attendeeSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType' },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  qrCode: { type: String, unique: true, index: true },
  qrSecret: { type: String, select: false },
  qrVersion: { type: Number, default: 1 },
  // Mã NGƯỜI ĐỌC ĐƯỢC (vd "K7X9Q2") để hiển thị cho attendee/nhân viên hỗ
  // trợ tham chiếu qua điện thoại — KHÔNG dùng để xác thực check-in (đó là
  // vai trò của qrCode ký HMAC ở trên). Trước đây FE phải hiển thị thẳng
  // Attendee._id (ObjectId 24 ký tự hex) làm "mã tham chiếu", rất khó đọc/
  // khó gõ lại cho người dùng cuối — field này giải quyết đúng vấn đề đó.
  // Duy nhất THEO TỪNG EVENT (không cần duy nhất toàn hệ thống) vì mục đích
  // chỉ là tra cứu nhanh trong phạm vi 1 sự kiện.
  ticketCode: { type: String, index: true },
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
    deviceInfo: String,
    // Mục 1.3 spec: "mọi thao tác manual check-in cần ghi log kèm lý do
    // và hiển thị riêng cho Organizer review" (chống nhân viên soát vé
    // check-in khống cho người quen). Field này thiếu ở bản trước —
    // KHÔNG đặt required:true ở mức schema vì chỉ bắt buộc khi
    // method === 'manual' (qr_scan/kiosk không cần); validate điều kiện
    // này nên làm ở tầng orchestrator (checkin.controller.js, Sprint 3)
    // hoặc custom validator riêng nếu muốn Mongoose tự chặn.
    manualReason: String
  },
  version: { type: Number, default: 0 },
  customFields: mongoose.Schema.Types.Mixed
}, { timestamps: true });

attendeeSchema.index({ eventId: 1, email: 1 }, { unique: true });
attendeeSchema.index({ eventId: 1, status: 1 });
attendeeSchema.index({ eventId: 1, ticketCode: 1 }, { unique: true, sparse: true });

// --- Sinh qrSecret + qrCode + ticketCode riêng cho từng attendee khi tạo mới ---
attendeeSchema.pre('validate', function () {
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
    if (!this.ticketCode) {
      this.ticketCode = generateTicketCode();
    }
  }
});

module.exports = mongoose.model('Attendee', attendeeSchema);