// server/src/middlewares/rateLimiter.middleware.js
//
// Rate limiting theo IP/thiết bị cho /api/checkin/scan (mục 2.2.A spec:
// "chống brute-force quét thử QR"). Kẻ tấn công brute-force sẽ thử rất
// nhiều token khác nhau TỪ CÙNG 1 thiết bị/kết nối — do đó key phải kết
// hợp cả IP lẫn deviceId, không dùng IP đơn thuần:
//   - Chỉ theo IP: 1 cổng có nhiều scanner_staff dùng chung mạng
//     Wi-Fi/NAT (rất phổ biến ở sự kiện thật) sẽ vô tình bị giới hạn
//     chung, dù mỗi máy chỉ quét bình thường.
//   - Chỉ theo deviceId: deviceId do client tự gửi lên trong body, kẻ tấn
//     công đổi field này mỗi request là bypass hoàn toàn.
// => key = `${ip}:${deviceId || 'no-device'}` thu hẹp đúng phạm vi
//    "1 thiết bị vật lý cụ thể", giữ nguyên khả năng nhiều thiết bị dùng
//    chung mạng vẫn hoạt động độc lập.
//
// Cần: npm install express-rate-limit (nếu package.json chưa có).
//
// ipKeyGenerator: express-rate-limit v7+ bắt buộc dùng helper này khi tự
// viết keyGenerator có dùng IP — nếu ghép thẳng req.ip vào string như
// trước, 1 client IPv6 có thể đổi phần cuối địa chỉ (host part) mỗi
// request để mỗi lần bị tính là 1 "key" khác nhau -> bypass rate limit
// hoàn toàn. Helper này chuẩn hoá IPv6 về đúng subnet /56 trước khi ghép
// key, IPv4 giữ nguyên.

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { fail } = require('../utils/apiResponse');

const WINDOW_MS = 60 * 1000; // 1 phút
// Một scanner_staff quét liên tục ở cổng đông cũng khó vượt vài chục
// lượt/phút thật; brute-force thử token ngẫu nhiên thường cần hàng trăm
// lượt/phút mới có ý nghĩa thống kê -> 30/phút/thiết bị là ngưỡng chặn
// brute-force mà không cản trở luồng quét thật.
const MAX_REQUESTS_PER_WINDOW = 30;

const scanRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS_PER_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  // deviceId nằm trong req.body (đã qua express.json() ở app.js trước khi
  // tới route này) — nếu client không gửi deviceId, vẫn fallback về IP
  // đơn thuần thay vì lỗi.
  keyGenerator: (req) => {
    const deviceId = req.body?.deviceId || 'no-device';
    return `${ipKeyGenerator(req.ip)}:${deviceId}`;
  },
  handler: (req, res) => {
    return fail(
      res,
      429,
      'Quét quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
      'RATE_LIMITED'
    );
  }
});

module.exports = { scanRateLimiter };