require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db'); // 1. Import hàm kết nối CSDL

const PORT = process.env.PORT || 5000;

// 2. Kết nối CSDL trước, sau đó mới bật Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
});