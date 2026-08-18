// server/src/models/CheckInLog.model.js
//
// CHƯA có trong repo trước đó (không nằm trong danh sách file bạn từng
// gửi) — viết mới, khớp 100% với mục 5.4 tài liệu spec và với enum
// OUTCOMES đã dùng sẵn trong checkin.service.js (success/duplicate/
// invalid_qr/expired_qr/wrong_geo/revoked). Nếu repo đã có bản khác,
// gửi lại để merge, đừng ghi đè.
//
// Append-only theo đúng spec: không dùng {timestamps:true} (không cần
// updatedAt vì log không bao giờ sửa), tự set createdAt bằng default.

const mongoose = require('mongoose');

const checkInLogSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendee', required: true, index: true },
  result: {
    type: String,
    enum: ['success', 'duplicate', 'invalid_qr', 'expired_qr', 'wrong_geo', 'revoked'],
    required: true
  },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gate: String,
  deviceId: String,
  clientTimestamp: Date,
  createdAt: { type: Date, default: Date.now }
});

// Truy vấn phổ biến ở dashboard/report: lịch sử quét của 1 event theo
// thời gian, và tra nhanh lịch sử của 1 attendee cụ thể.
checkInLogSchema.index({ eventId: 1, createdAt: -1 });
checkInLogSchema.index({ attendeeId: 1, createdAt: -1 });

module.exports = mongoose.model('CheckInLog', checkInLogSchema);