const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const Attendee = require('./models/Attendee.model');
const Event = require('./models/Event.model');
const attendeeRoutes = require('./routes/attendee.routes');
const authRoutes = require('./routes/auth.routes');
const checkinRoutes = require('./routes/checkin.routes');
const { authenticate, authorize } = require('./middlewares/auth.middleware');
const { errorHandler } = require('./middlewares/errorHandler.middleware');

const app = express();

// Middlewares
//
// credentials:true + origin cụ thể (KHÔNG dùng '*') bắt buộc khi client
// gửi kèm cookie (auth dùng cookie httpOnly) — CORS chặn cookie cross-site
// nếu origin là wildcard.
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true
}));
app.use(express.json());
// BẮT BUỘC: thiếu dòng này, req.cookies luôn undefined -> auth.controller.js
// (đọc REFRESH_COOKIE) và auth.middleware.js (đọc ACCESS_COOKIE) sẽ luôn
// coi như "chưa đăng nhập" dù cookie đã được trình duyệt gửi lên đúng.
// Cần `npm install cookie-parser` nếu package.json chưa có.
app.use(cookieParser());

// Health check route
app.get('/', (req, res) => {
  res.send('Server QR Attendance đang hoạt động!');
});

app.use('/api/auth', authRoutes);
app.use('/api/checkin', checkinRoutes);

// API lấy danh sách Attendees từ MongoDB
//
// Trước đây route này PUBLIC, KHÔNG filter -> trả toàn bộ attendee của
// MỌI event/tổ chức (kèm email/phone) cho bất kỳ ai gọi, kể cả chưa đăng
// nhập. Vi phạm mục 1.1/1.2/1.4 của spec. Đã khoá lại:
// - authenticate + authorize: bắt buộc đăng nhập, đúng 1 trong 3 role.
// - super_admin: xem toàn hệ thống (đúng vai trò mục 1.1).
// - organizer/scanner_staff: chỉ thấy attendee thuộc event của
//   organization mình, lọc qua Event.organizationId (Attendee không lưu
//   trực tiếp organizationId nên phải join gián tiếp qua eventId).
//
// LƯU Ý: đây vẫn là route tạm/dev — chưa phân trang, chưa cho filter
// theo 1 eventId cụ thể, chưa giới hạn field trả về (vd loại field nội
// bộ). Khi làm attendee.controller.js thật (ngoài phạm vi 4 file lần
// này) nên thay hẳn route inline này bằng controller riêng.
app.get(
  '/api/attendees',
  authenticate,
  authorize('super_admin', 'organizer', 'scanner_staff'),
  async (req, res, next) => {
    try {
      const filter = {};

      if (req.user.role !== 'super_admin') {
        const orgEventIds = await Event.find({
          organizationId: req.user.organizationId
        }).distinct('_id');
        filter.eventId = { $in: orgEventIds };
      }

      const attendees = await Attendee.find(filter);
      res.json({ success: true, data: attendees });
    } catch (error) {
      next(error);
    }
  }
);

// Route con /api/attendees/:id/qr (và các route attendee khác về sau)
app.use('/api/attendees', attendeeRoutes);

// Middleware xử lý lỗi tập trung — PHẢI mount SAU cùng, sau mọi route.
app.use(errorHandler);

module.exports = app;