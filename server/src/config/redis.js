const { createClient } = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
      socket: {
        // Dừng thử lại sau 2 lần thất bại để không làm rác log terminal
        reconnectStrategy: (retries) => {
          if (retries >= 2) {
            return false; // Ngừng reconnect
          }
          return 1000;
        }
      }
    });

    // Bỏ qua log lỗi liên tục khi ngắt kết nối
    redisClient.on('error', () => {});

    await redisClient.connect();
    console.log('✅ Kết nối Redis thành công');
  } catch (error) {
    console.warn('⚠️ Chưa bật Redis local (Server vẫn chạy bình thường không cần Redis):', error.message);
  }
};

module.exports = { connectRedis, getRedisClient: () => redisClient };