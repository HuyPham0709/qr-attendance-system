// server/src/models/SyncQueue.model.js
//
// Hàng đợi tạm cho batch check-in gửi lên từ Scanner PWA khi hết offline
// (mục 2.2.B + 5.5 spec) — thay thế BullMQ/Redis, dùng chính MongoDB làm
// nơi lưu tạm. Khi client đồng bộ lại, mỗi lượt quét offline được ghi 1
// bản ghi 'pending' ở đây; 1 hàm xử lý tuần tự (sync.service.js — chưa
// nằm trong phạm vi 4 file lần này) sẽ duyệt từng bản ghi qua đúng logic
// processCheckIn/evaluateCheckIn hiện có, rồi cập nhật lại status.
//
// Field khớp đúng mô tả trong tài liệu: token (QR token quét lúc offline),
// không lưu attendeeId trực tiếp vì lúc quét offline chưa chắc verify được
// attendeeId (token có thể invalid/expired) — việc đó để hàm xử lý tuần
// tự tự decode lại bằng processCheckIn/evaluateCheckIn.

const mongoose = require('mongoose');

const syncQueueSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
  token: { type: String, required: true }, // QR token quét được lúc offline
  gate: String,
  deviceId: String,
  clientTimestamp: Date,
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending',
    index: true
  },
  processResult: String,
  createdAt: { type: Date, default: Date.now }
});

// Truy vấn phổ biến nhất của sync.service.js: lấy các bản ghi 'pending'
// của 1 event cụ thể, xử lý tuần tự theo thứ tự gửi lên (createdAt).
syncQueueSchema.index({ eventId: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model('SyncQueue', syncQueueSchema);
