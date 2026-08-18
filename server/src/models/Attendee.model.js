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

// --- Sinh qrSecret + qrCode riêng cho từng attendee ngay khi tạo mới ---
// (không đổi so với bản trước — xem giải thích đầy đủ ở comment gốc)
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
  }
});

module.exports = mongoose.model('Attendee', attendeeSchema);