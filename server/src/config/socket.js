// server/src/config/socket.js
//
// Khởi tạo Socket.io — in-memory adapter mặc định của thư viện, KHÔNG
// gắn Redis adapter, đúng tinh thần mục 2.2.B/3 spec: "chạy trên chính
// Node.js instance, không cần Redis vì hệ thống chạy 1 instance duy
// nhất". Nếu sau này scale ra nhiều instance, đây là chỗ duy nhất cần
// đổi (gắn @socket.io/redis-adapter), không phải sửa nơi gọi emit.
//
// Instance `io` được lưu module-level để mọi nơi khác (vd
// checkin.controller.js) lấy lại qua getIO() mà không cần truyền io qua
// req/res hoặc import vòng lặp ngược lại server.js.

const { Server } = require('socket.io');
const { registerSocketHandlers } = require('../sockets');

let io = null;

/**
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN,
      credentials: true
    }
  });

  registerSocketHandlers(io);

  return io;
}

/**
 * Lấy lại instance io đã khởi tạo. Controller gọi hàm này để emit —
 * KHÔNG import trực tiếp io từ đây bằng destructure ở top-level module
 * khác, vì lúc file đó được require, initSocket() có thể chưa chạy
 * xong (io vẫn là null) — phải gọi getIO() tại thời điểm emit (runtime),
 * không phải tại thời điểm require (load time).
 *
 * @returns {Server}
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io chưa được khởi tạo — initSocket(httpServer) phải chạy trước trong server.js.');
  }
  return io;
}

module.exports = { initSocket, getIO };
