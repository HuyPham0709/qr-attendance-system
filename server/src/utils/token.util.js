const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';

// Fail-fast lúc khởi động thay vì phát hiện lúc runtime có request đầu tiên -
// thiếu secret là lỗi cấu hình nghiêm trọng, không nên chạy server khi thiếu.
if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET và JWT_REFRESH_SECRET bắt buộc phải có trong .env');
}
if (ACCESS_SECRET === REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET và JWT_REFRESH_SECRET phải khác nhau');
}

function signAccessToken({ userId, role, organizationId }) {
  return jwt.sign(
    { sub: userId, role, organizationId },
    ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: ACCESS_TTL }
  );
}

// algorithms cố định 'HS256' khi verify -> chặn kiểu tấn công "alg confusion"
// (vd kẻ tấn công gửi token với alg:"none" hoặc đổi sang RS256 dùng public key làm secret).
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, { algorithms: ['HS256'] });
}

function signRefreshToken({ userId, family, expiresInSeconds }) {
  // jti ngẫu nhiên riêng cho từng refresh token, dùng để hash & lưu DB.
  const jti = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign(
    { sub: userId, family, jti },
    REFRESH_SECRET,
    { algorithm: 'HS256', expiresIn: expiresInSeconds }
  );
  return { token, jti };
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET, { algorithms: ['HS256'] });
}

function hashToken(rawValue) {
  // SHA-256 đủ dùng để lưu "dấu vân tay" của jti trong DB.
  // Đây KHÔNG phải hash mật khẩu nên không cần bcrypt/salt/cost-factor ở đây.
  return crypto.createHash('sha256').update(rawValue).digest('hex');
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken
};