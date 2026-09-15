// server/src/models/Announcement.model.js
//
// Thông báo do Organizer đăng cho 1 sự kiện cụ thể (đổi giờ, đổi địa điểm,
// nhắc mang gì khi tới...). Attendee xem công khai ở trang "Thông báo"
// (client-attendee/src/pages/Notifications.jsx) — KHÔNG cần đăng nhập để
// đọc, chỉ Organizer/Super Admin mới được tạo/sửa/xóa.
//
// Đây là collection MỚI, không đụng tới schema của bất kỳ model nào khác.

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    // Ghim lên đầu danh sách (vd thông báo khẩn: đổi địa điểm phút chót).
    isPinned: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// Truy vấn phổ biến nhất: lấy thông báo của 1 event, thông báo ghim lên
// trước, mới nhất trước.
announcementSchema.index({ eventId: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
