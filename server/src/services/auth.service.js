const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken
} = require('../utils/token.util');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút
const SLIDING_DAYS = Number(process.env.REFRESH_TOKEN_SLIDING_DAYS || 7);
const ABSOLUTE_DAYS = Number(process.env.REFRESH_TOKEN_ABSOLUTE_DAYS || 30);

// Hash bcrypt hợp lệ tính sẵn 1 lần lúc khởi động, dùng để so sánh khi
// email không tồn tại trong DB - giữ thời gian phản hồi tương đương trường
// hợp "email đúng nhưng sai mật khẩu", tránh lộ thông tin email nào tồn tại
// qua chênh lệch thời gian phản hồi (timing attack / user enumeration).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-constant-time-compare', 10);

class AuthError extends Error {
  constructor(message, status = 401, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function issueTokenPair({ user, family, familyExpiresAt, ip, userAgent }) {
  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    organizationId: user.organizationId.toString()
  });

  const slidingExpiresAt = new Date(Date.now() + SLIDING_DAYS * 86400000);
  // Hạn thực tế = sớm hơn giữa (trượt theo hoạt động) và (trần tuyệt đối của cả family).
  const expiresAt = slidingExpiresAt < familyExpiresAt ? slidingExpiresAt : familyExpiresAt;
  const expiresInSeconds = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  const { token: refreshToken, jti } = signRefreshToken({
    userId: user._id.toString(),
    family,
    expiresInSeconds
  });

  const tokenHash = hashToken(jti);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    family,
    familyExpiresAt,
    expiresAt,
    createdByIp: ip,
    userAgent
  });

  return {
    accessToken,
    refreshToken,
    tokenHash,
    refreshMaxAgeMs: expiresAt.getTime() - Date.now()
  };
}

async function login({ email, password, ip, userAgent }) {
  const genericError = () => new AuthError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw genericError();
  }

  if (user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new AuthError(
      `Tài khoản tạm khoá do đăng nhập sai nhiều lần. Thử lại sau ${minutesLeft} phút.`,
      423,
      'ACCOUNT_LOCKED'
    );
  }

  if (!user.isActive) {
    throw new AuthError('Tài khoản đã bị vô hiệu hoá', 403, 'ACCOUNT_DISABLED');
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);

  if (!passwordOk) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw genericError();
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const family = crypto.randomUUID();
  const familyExpiresAt = new Date(Date.now() + ABSOLUTE_DAYS * 86400000);

  const { accessToken, refreshToken, refreshMaxAgeMs } = await issueTokenPair({
    user, family, familyExpiresAt, ip, userAgent
  });

  return {
    accessToken,
    refreshToken,
    refreshMaxAgeMs,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    }
  };
}

async function refresh({ refreshToken, ip, userAgent }) {
  if (!refreshToken) {
    throw new AuthError('Thiếu refresh token', 401, 'NO_REFRESH_TOKEN');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthError('Refresh token không hợp lệ hoặc đã hết hạn', 401, 'INVALID_REFRESH_TOKEN');
  }

  const tokenHash = hashToken(payload.jti);
  const record = await RefreshToken.findOne({ tokenHash });

  if (!record) {
    throw new AuthError('Refresh token không hợp lệ', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (record.revokedAt) {
    // Token đã bị revoke nhưng vẫn được đem ra dùng lại -> dấu hiệu bị đánh cắp.
    // Phản ứng: khoá toàn bộ family (mọi thiết bị của phiên đăng nhập đó) ngay lập tức.
    await RefreshToken.updateMany(
      { family: record.family, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    throw new AuthError(
      'Phát hiện refresh token bị dùng lại - phiên đăng nhập đã bị thu hồi vì lý do bảo mật',
      401,
      'REFRESH_REUSE_DETECTED'
    );
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw new AuthError('Refresh token đã hết hạn, vui lòng đăng nhập lại', 401, 'REFRESH_EXPIRED');
  }

  const user = await User.findById(record.userId);
  if (!user || !user.isActive) {
    throw new AuthError('Tài khoản không còn hoạt động', 403, 'ACCOUNT_DISABLED');
  }

  const { accessToken, refreshToken: newRefreshToken, tokenHash: newTokenHash, refreshMaxAgeMs } =
    await issueTokenPair({
      user,
      family: record.family,
      familyExpiresAt: record.familyExpiresAt,
      ip,
      userAgent
    });

  record.revokedAt = new Date();
  record.replacedByHash = newTokenHash;
  await record.save();

  return { accessToken, refreshToken: newRefreshToken, refreshMaxAgeMs };
}

async function logout({ refreshToken }) {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(payload.jti);
    await RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  } catch {
    // Token không hợp lệ/đã hết hạn -> coi như đã đăng xuất, không cần báo lỗi cho client.
  }
}

module.exports = { login, refresh, logout, AuthError };