const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Middlewares
const errorHandler = require('./middlewares/errorHandler.middleware');

// Routes
const attendeeRoutes = require('./routes/attendee.routes');
const eventRoutes = require('./routes/event.routes');
const ticketTypeRoutes = require('./routes/ticketType.routes');
const authRoutes = require('./routes/auth.routes');
const checkinRoutes = require('./routes/checkin.routes');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get('/', (req, res) => {
  res.send('Server QR Attendance đang hoạt động!');
});

// Đăng ký các Route API chính
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickettypes', ticketTypeRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/attendees', attendeeRoutes); // Đã xóa đoạn app.get('/api/attendees') viết đè trước đó

// Middleware xử lý lỗi tập trung (Luôn đặt ở CUỐI CÙNG sau các routes)
if (typeof errorHandler === 'function') {
  app.use(errorHandler);
}

module.exports = app;