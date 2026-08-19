// server/src/services/auth.service.js
//
// Viết khớp với các file đã có sẵn trong repo:
// - token.util.js: signAccessToken/verifyAccessToken (JWT access, payload
//   {sub, role, organizationId}), signRefreshToken/verifyRefreshToken (JWT
//   refresh, payload {sub, family, jti}), hashToken (SHA-256 của jti).
// - RefreshToken.model.js: mỗi lần refresh là 1 document mới (rotation),
//   cùng field `family` xuyên suốt 1 phiên đăng nhập, `familyExpiresAt`
//   là trần tuyệt đối không đổi khi rotate.
// - User.model.js: passwordHash (select:false), isActive, isLocked(),
//   failedLoginAttempts, lockUntil.

// package.json chỉ có "bcryptjs" (pure JS), không có "bcrypt" (native
// binding) — 2 package khác nhau tuy API tương thích. require('bcrypt')
// ở bản trước sẽ crash ngay lúc load module vì package đó chưa cài.
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const {
  signAccessToken,
  signTwoFactorPendingToken,
  verifyTwoFactorPendingToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken
} = require('../utils/token.util');
const twoFactorService = require('./twoFactor.service');

// Mục 1.1 spec: "Rủi ro: tài khoản Super Admin bị chiếm quyền -> toàn hệ
// thống lộ -> cần bắt buộc 2FA cho vai trò này". Danh sách role BẮT BUỘC
// 2FA, không phải tuỳ chọn — nếu 1 super_admin chưa từng setup 2FA, login
// KHÔNG cấp token thẳng mà ép qua flow setup trước.
const ROLES_REQUIRE_2FA = ['super_admin'];

// --- Cấu hình (đọc từ env, có default hợp lý nếu thiếu) ---
const MAX_FAILED_ATTEMPTS = Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS || 5);
const LOCK_DURATION_MS = Number(process.env.ACCOUNT_LOCK_MINUTES || 15) * 60 * 1000;
const REFRESH_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60;
const REFRESH_ABSOLUTE_TTL_SECONDS =
  Number(process.env.REFRESH_TOKEN_ABSOLUTE_TTL_DAYS || 30) * 24 * 60 * 60;

/**
 * Lỗi nghiệp vụ auth — auth.controller.js đã bắt bằng
 * `err instanceof authService.AuthError` nên phải export đúng class này
 * (không phải 1 class trùng tên định nghĩa lại ở nơi khác).
 */
class AuthError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

/** Bỏ các field nhạy cảm trước khi trả user về client. */
function sanitizeUser(userDoc) {
  return {
    id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    organizationId: userDoc.organizationId,
    assignedEvents: userDoc.assignedEvents
  };
}

/**
 * Đăng nhập.
 * @returns {{accessToken:string, refreshToken:string, refreshMaxAgeMs:number, user:object}}
 */
async function login({ email, password, ip, userAgent }) {
  const user = await User.findOne({ email }).select('+passwordHash');

  // Cố tình dùng CHUNG 1 thông báo lỗi cho "không có email" và "sai mật
  // khẩu" — tránh lộ thông tin email nào đã đăng ký trong hệ thống
  // (user enumeration).
  if (!user) {
    throw new AuthError(401, 'Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AuthError(403, 'Tài khoản đã bị khoá, liên hệ quản trị viên', 'ACCOUNT_DISABLED');
  }

  if (user.isLocked()) {
    throw new AuthError(
      423,
      'Tài khoản tạm khoá do đăng nhập sai quá nhiều lần, vui lòng thử lại sau',
      'ACCOUNT_LOCKED'
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      // Reset về 0 luôn sau khi khoá, để lần mở khoá tiếp theo tính lại
      // từ đầu thay vì cộng dồn vô hạn.
      user.failedLoginAttempts = 0;
    }

    await user.save();
    throw new AuthError(401, 'Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
  }

  // Đăng nhập đúng -> reset bộ đếm.
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }

  // --- Rẽ nhánh 2FA ---
  // Email/password đúng KHÔNG có nghĩa là cấp token ngay với các role bắt
  // buộc 2FA. Ở bước này CHƯA cấp accessToken/refreshToken thật, chỉ cấp
  // 1 pendingToken sống ngắn để FE dùng tiếp cho bước nhập mã (hoặc bước
  // setup lần đầu nếu tài khoản chưa có 2FA).
  if (ROLES_REQUIRE_2FA.includes(user.role)) {
    const pendingToken = signTwoFactorPendingToken({
      userId: String(user._id),
      stage: user.twoFactorEnabled ? 'login' : 'setup'
    });

    return user.twoFactorEnabled
      ? { requires2FA: true, pendingToken }
      : { requires2FASetup: true, pendingToken };
  }

  return issueTokensForUser(user, { ip, userAgent });
}

/**
 * Phần cấp access/refresh token thật + tạo bản ghi RefreshToken — dùng
 * chung cho 3 chỗ: (1) login không cần 2FA, (2) verify2FALogin sau khi
 * nhập đúng mã, (3) confirm2FASetup (tự động đăng nhập luôn sau khi
 * setup 2FA lần đầu thành công, khỏi bắt user login lại 1 lần nữa).
 */
async function issueTokensForUser(user, { ip, userAgent }) {
  const accessToken = signAccessToken({
    userId: String(user._id),
    role: user.role,
    organizationId: user.organizationId ? String(user.organizationId) : null
  });

  const family = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const familyExpiresAt = new Date(now + REFRESH_ABSOLUTE_TTL_SECONDS * 1000);
  const expiresAt = new Date(now + REFRESH_TTL_SECONDS * 1000);

  const { token: refreshToken, jti } = signRefreshToken({
    userId: String(user._id),
    family,
    expiresInSeconds: REFRESH_TTL_SECONDS
  });

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(jti),
    family,
    familyExpiresAt,
    expiresAt,
    createdByIp: ip,
    userAgent
  });

  return {
    accessToken,
    refreshToken,
    refreshMaxAgeMs: REFRESH_TTL_SECONDS * 1000,
    user: sanitizeUser(user)
  };
}

/**
 * Bước 2 của luồng login khi tài khoản ĐÃ bật 2FA (super_admin).
 * Nhận pendingToken cấp ở login() (stage:'login') + mã 6 số người dùng
 * gõ từ app xác thực, verify bằng chính secret đã lưu trong DB.
 */
async function verify2FALogin({ pendingToken, code, ip, userAgent }) {
  const payload = decodePendingToken(pendingToken, 'login');

  const user = await User.findById(payload.sub).select('+twoFactorSecret');
  if (!user || !user.isActive || !user.twoFactorEnabled) {
    throw new AuthError(401, 'Phiên xác thực không hợp lệ, vui lòng đăng nhập lại', 'INVALID_2FA_SESSION');
  }

  if (!twoFactorService.verifyCode(code, user.twoFactorSecret)) {
    throw new AuthError(401, 'Mã xác thực không đúng hoặc đã hết hạn', 'INVALID_2FA_CODE');
  }

  return issueTokensForUser(user, { ip, userAgent });
}

/**
 * Bước setup 2FA lần đầu (mục 1.1: bắt buộc với super_admin chưa có 2FA).
 * Sinh 1 secret TẠM (chưa lưu vào twoFactorSecret thật) + QR để quét, trả
 * cho FE hiển thị. Secret tạm này chỉ có hiệu lực sau khi user xác nhận
 * đúng 1 mã ở confirm2FASetup().
 */
async function setup2FA({ pendingToken }) {
  const payload = decodePendingToken(pendingToken, 'setup');

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new AuthError(401, 'Phiên xác thực không hợp lệ, vui lòng đăng nhập lại', 'INVALID_2FA_SESSION');
  }
  if (user.twoFactorEnabled) {
    throw new AuthError(400, 'Tài khoản đã bật 2FA từ trước', 'TWO_FA_ALREADY_ENABLED');
  }

  const secret = twoFactorService.generateSecret();
  user.twoFactorTempSecret = secret;
  await user.save();

  const otpAuthUri = twoFactorService.buildOtpAuthUri(user.email, secret);
  const qrCodeDataUrl = await twoFactorService.generateQrCodeDataUrl(otpAuthUri);

  return { qrCodeDataUrl, secret };
}

/**
 * Xác nhận setup 2FA: user nhập mã app xác thực vừa sinh ra từ secret tạm
 * ở bước trên. Đúng -> secret tạm trở thành secret thật, bật
 * twoFactorEnabled, VÀ đăng nhập luôn (không bắt gõ lại email/password).
 */
async function confirm2FASetup({ pendingToken, code, ip, userAgent }) {
  const payload = decodePendingToken(pendingToken, 'setup');

  const user = await User.findById(payload.sub).select('+twoFactorTempSecret');
  if (!user || !user.isActive) {
    throw new AuthError(401, 'Phiên xác thực không hợp lệ, vui lòng đăng nhập lại', 'INVALID_2FA_SESSION');
  }
  if (!user.twoFactorTempSecret) {
    throw new AuthError(400, 'Chưa khởi tạo setup 2FA, gọi /2fa/setup trước', 'TWO_FA_SETUP_NOT_STARTED');
  }

  if (!twoFactorService.verifyCode(code, user.twoFactorTempSecret)) {
    throw new AuthError(401, 'Mã xác thực không đúng', 'INVALID_2FA_CODE');
  }

  user.twoFactorSecret = user.twoFactorTempSecret;
  user.twoFactorTempSecret = null;
  user.twoFactorEnabled = true;
  await user.save();

  return issueTokensForUser(user, { ip, userAgent });
}

function decodePendingToken(pendingToken, expectedStage) {
  if (!pendingToken) {
    throw new AuthError(401, 'Thiếu pendingToken', 'NO_2FA_PENDING_TOKEN');
  }
  try {
    return verifyTwoFactorPendingToken(pendingToken, expectedStage);
  } catch {
    throw new AuthError(401, 'pendingToken không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại', 'INVALID_2FA_PENDING_TOKEN');
  }
}

/**
 * Cấp lại access token + refresh token mới (rotation) từ refresh token cũ.
 * Phát hiện reuse: nếu refresh token đưa lên đã từng bị revoke trước đó
 * (tức là đã được rotate 1 lần, giờ ai đó lại dùng bản cũ) -> coi như bị
 * đánh cắp, revoke NGAY TOÀN BỘ family (mọi refresh token cùng phiên).
 */
async function refresh({ refreshToken, ip, userAgent }) {
  if (!refreshToken) {
    throw new AuthError(401, 'Thiếu refresh token', 'NO_REFRESH_TOKEN');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthError(401, 'Refresh token không hợp lệ hoặc đã hết hạn', 'INVALID_REFRESH_TOKEN');
  }

  const tokenHash = hashToken(payload.jti);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored) {
    throw new AuthError(401, 'Refresh token không hợp lệ', 'INVALID_REFRESH_TOKEN');
  }

  if (stored.revokedAt) {
    // Token này đã bị revoke từ trước (do đã rotate 1 lần) mà vẫn có
    // request dùng lại -> dấu hiệu token bị đánh cắp và dùng song song
    // với bản đã rotate. Revoke toàn bộ family để buộc đăng nhập lại
    // trên MỌI thiết bị đang giữ refresh token của phiên này.
    await RefreshToken.updateMany(
      { family: stored.family, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    throw new AuthError(
      401,
      'Phát hiện refresh token bị tái sử dụng, vui lòng đăng nhập lại',
      'REFRESH_TOKEN_REUSE'
    );
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    throw new AuthError(401, 'Refresh token đã hết hạn', 'REFRESH_TOKEN_EXPIRED');
  }

  if (stored.familyExpiresAt.getTime() < Date.now()) {
    throw new AuthError(401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'SESSION_EXPIRED');
  }

  const user = await User.findById(stored.userId);
  if (!user || !user.isActive) {
    throw new AuthError(403, 'Tài khoản không còn khả dụng', 'ACCOUNT_DISABLED');
  }

  // --- Rotate: revoke bản ghi cũ, tạo bản ghi mới cùng family ---
  const now = Date.now();
  // Sliding TTL nhưng không bao giờ vượt quá familyExpiresAt tuyệt đối.
  const nextExpiresAt = new Date(
    Math.min(now + REFRESH_TTL_SECONDS * 1000, stored.familyExpiresAt.getTime())
  );

  const { token: newRefreshToken, jti: newJti } = signRefreshToken({
    userId: String(user._id),
    family: stored.family,
    expiresInSeconds: Math.max(1, Math.floor((nextExpiresAt.getTime() - now) / 1000))
  });

  const newHash = hashToken(newJti);

  stored.revokedAt = new Date();
  stored.replacedByHash = newHash;
  await stored.save();

  await RefreshToken.create({
    userId: user._id,
    tokenHash: newHash,
    family: stored.family,
    familyExpiresAt: stored.familyExpiresAt,
    expiresAt: nextExpiresAt,
    createdByIp: ip,
    userAgent
  });

  const accessToken = signAccessToken({
    userId: String(user._id),
    role: user.role,
    organizationId: user.organizationId ? String(user.organizationId) : null
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    refreshMaxAgeMs: nextExpiresAt.getTime() - now
  };
}

/**
 * Đăng xuất: revoke toàn bộ family của refresh token hiện tại (đăng xuất
 * cả phiên, không chỉ 1 bản ghi) để refresh token không dùng lại được.
 *
 * LƯU Ý: access token (JWT, không lưu DB) vẫn còn hiệu lực tới khi hết
 * TTL riêng của nó (15 phút theo token.util.js) — đây là giới hạn cố hữu
 * của access token dạng JWT stateless, không có blacklist. Muốn revoke
 * access token ngay lập tức cần thêm 1 tầng blacklist (vd Redis), ngoài
 * phạm vi của service này.
 *
 * Cố tình KHÔNG throw lỗi nếu token thiếu/không hợp lệ — logout phải luôn
 * "thành công" từ góc nhìn client để cookie chắc chắn được xoá.
 */
async function logout({ refreshToken }) {
  if (!refreshToken) return;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return;
  }

  const tokenHash = hashToken(payload.jti);
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored) return;

  await RefreshToken.updateMany(
    { family: stored.family, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

module.exports = {
  AuthError,
  login,
  verify2FALogin,
  setup2FA,
  confirm2FASetup,
  refresh,
  logout
};