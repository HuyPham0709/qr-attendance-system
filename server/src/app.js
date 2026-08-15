const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // 0. BẮT BUỘC để đọc được cookie gửi lên (req.cookies)
// Import Model Attendee của MongoDB
const Attendee = require('./models/Attendee.model');
const attendeeRoutes = require('./routes/attendee.routes');
// 1. Thêm import authRoutes
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser()); // 0b. Phải đăng ký TRƯỚC mọi route cần đọc req.cookies

// Health check route
app.get('/', (req, res) => {
  res.send('Server QR Attendance đang hoạt động!');
});

// API lấy danh sách Attendees từ MongoDB
app.get('/api/attendees', async (req, res) => {
  try {
    // Truy vấn tất cả người tham dự trong MongoDB
    const attendees = await Attendee.find();
    res.json({ success: true, data: attendees });
  } catch (error) {
    console.error('Lỗi server khi lấy danh sách attendees:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route con /api/attendees/:id/qr (và các route attendee khác về sau)
app.use('/api/attendees', attendeeRoutes);

// 2. Thêm đăng ký route auth ở đây
app.use('/api/auth', authRoutes);

module.exports = app;