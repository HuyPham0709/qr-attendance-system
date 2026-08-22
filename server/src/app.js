const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const attendeeRoutes = require('./routes/attendee.routes');
const authRoutes = require('./routes/auth.routes');
const checkinRoutes = require('./routes/checkin.routes');
const eventRoutes = require('./routes/event.routes');
const ticketTypeRoutes = require('./routes/ticketType.routes');
const organizationRoutes = require('./routes/organization.routes');
const userRoutes = require('./routes/user.routes');
const checkinLogRoutes = require('./routes/checkinLog.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { errorHandler } = require('./middlewares/errorHandler.middleware');

const app = express();

// Middlewares
//
// credentials:true + origin cụ thể (KHÔNG dùng '*') bắt buộc khi client
// gửi kèm cookie (auth dùng cookie httpOnly) — CORS chặn cookie cross-site
// nếu origin là wildcard.
//
// BUG đã sửa: code cũ đọc `process.env.CLIENT_ORIGIN`, nhưng .env.example
// lại định nghĩa `CLIENT_ADMIN_ORIGIN` / `CLIENT_SCANNER_ORIGIN` — 2 tên
// biến không khớp nhau nên CLIENT_ORIGIN LUÔN LÀ undefined bất kể .env có
// gì. `cors({ origin: undefined })` không set Access-Control-Allow-Origin
// cho BẤT KỲ origin nào -> mọi preflight request từ trình duyệt đều bị
// chặn, kể cả khi mọi thứ khác (route, cookie, JWT...) đã đúng hoàn toàn.
// Đây là lý do lỗi CORS xảy ra, không liên quan gì tới phần login/2FA.
//
// Sửa: đọc danh sách origin được phép từ NHIỀU biến env (khớp đúng tên
// trong .env.example) + hỗ trợ thêm CLIENT_ORIGIN dạng 1 hoặc nhiều origin
// cách nhau bởi dấu phẩy, để không bị cứng vào đúng 1 cổng 5173/5174 —
// môi trường dev có thể chạy ở cổng khác (vd devcontainer/cloud IDE hay
// forward qua 1 cổng khác như 8443).
const allowedOrigins = [
  process.env.CLIENT_ADMIN_ORIGIN,
  process.env.CLIENT_SCANNER_ORIGIN,
  ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : [])
]
  .map((o) => o && o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // origin undefined = request không qua trình duyệt (vd curl, Postman,
    // server-to-server) hoặc same-origin -> luôn cho qua, không phải lỗ
    // hổng vì cookie httpOnly chỉ có giá trị khi trình duyệt tự gửi kèm.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin "${origin}" không nằm trong whitelist`));
  },
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
app.use('/api/events', eventRoutes);
app.use('/api/ticket-types', ticketTypeRoutes);

// Route con /api/attendees (CRUD + QR + check-in)
app.use('/api/attendees', attendeeRoutes);

app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/checkin/logs', checkinLogRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Middleware xử lý lỗi tập trung — PHẢI mount SAU cùng, sau mọi route.
app.use(errorHandler);

module.exports = app;