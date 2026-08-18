require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db'); // 1. Import hàm kết nối CSDL
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;

// app.listen(PORT) trước đây tự tạo 1 http.Server ẩn bên trong rồi bỏ đi
// ngay, Socket.io không có cách nào lấy lại instance đó để gắn vào cùng
// cổng. Phải tự tạo httpServer từ app rồi initSocket(httpServer) TRƯỚC
// khi listen, sau đó gọi httpServer.listen() thay vì app.listen().
const httpServer = http.createServer(app);
initSocket(httpServer);

// Kết nối CSDL trước, sau đó mới bật Server
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT} (kèm Socket.io)`);
  });
});
