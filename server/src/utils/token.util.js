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

// --- Token 2FA tạm thời ---
// Dùng SAU khi email/password đúng nhưng TRƯỚC khi có mã 2FA đúng.
// Ký bằng ACCESS_SECRET nhưng có claim `purpose: '2fa_pending'` riêng và
// verifyTwoFactorPendingToken() bắt buộc kiểm tra claim này, để token
// loại này không thể bị đưa nhầm vào chỗ đang cần access token thật (vd
// nếu lỡ gắn vào cookie/middleware authenticate) — authenticate() ở
// auth.middleware.js không đọc payload.purpose nên 1 access token thật
// sẽ không có claim này và ngược lại.
// TTL ngắn (mặc định 5 phút): đủ thời gian người dùng mở app xác thực
// gõ mã, nhưng không treo lâu nếu họ bỏ dở giữa chừng.
const TWO_FA_PENDING_TTL = process.env.TWO_FA_PENDING_TTL || '5m';

function signTwoFactorPendingToken({ userId, stage }) {
  // stage: 'login' (đã bật 2FA, chờ nhập mã) hoặc 'setup' (chưa bật,
  // đang ép thiết lập lần đầu) — verify2FALogin/confirm2FASetup dùng
  // đúng handler theo stage, tránh nhầm luồng.
  return jwt.sign(
    { sub: userId, purpose: '2fa_pending', stage },
    ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: TWO_FA_PENDING_TTL }
  );
}

function verifyTwoFactorPendingToken(token, expectedStage) {
  const payload = jwt.verify(token, ACCESS_SECRET, { algorithms: ['HS256'] });
  if (payload.purpose !== '2fa_pending' || payload.stage !== expectedStage) {
    throw new Error('Sai loại token 2FA');
  }
  return payload;
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
  signTwoFactorPendingToken,
  verifyTwoFactorPendingToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken
};