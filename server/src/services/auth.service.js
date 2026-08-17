const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken
} = require('../utils/token.util');

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút
const SLIDING_DAYS = Number(process.env.REFRESH_TOKEN_SLIDING_DAYS || 7);
const ABSOLUTE_DAYS = Number(process.env.REFRESH_TOKEN_ABSOLUTE_DAYS || 30);

// Hash bcrypt giả lập tính sẵn để tránh lộ thông tin qua chênh lệch thời gian phản hồi (Timing Attack)
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-constant-time-compare', 10);

// Lớp AuthError tương thích linh hoạt với cả 2 kiểu truyền tham số từ 2 nhánh
class AuthError extends Error {
  constructor(messageOrStatus, statusOrMessage = 401, code = 'AUTH_ERROR') {
    let message, status;
    if (typeof messageOrStatus === 'number') {
      status = messageOrStatus;
      message = statusOrMessage;
    } else {
      message = messageOrStatus;
      status = statusOrMessage;
    }
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    organizationId: user.organizationId ? user.organizationId.toString() : null,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    assignedEvents: user.assignedEvents || []
  };
}

async function issueTokenPair({ user, family, familyExpiresAt, ip, userAgent }) {
  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    organizationId: user.organizationId ? user.organizationId.toString() : null
  });

  const slidingExpiresAt = new Date(Date.now() + SLIDING_DAYS * 86400000);
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
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new AuthError(400, 'Email và mật khẩu là bắt buộc', 'INVALID_INPUT');
  }

  const genericError = () => new AuthError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw genericError();
  }

  if (typeof user.isLocked === 'function' && user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new AuthError(
      `Tài khoản tạm khoá do đăng nhập sai nhiều lần. Thử lại sau ${minutesLeft} phút.`,
      423,
      'ACCOUNT_LOCKED'
    );
  }

  if (!user.isActive) {
    throw new AuthError('Tài khoản đã bị vô hiệu hóa', 403, 'ACCOUNT_DISABLED');
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);

  if (!passwordOk) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
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

  const family = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  const familyExpiresAt = new Date(Date.now() + ABSOLUTE_DAYS * 86400000);

  const { accessToken, refreshToken, refreshMaxAgeMs } = await issueTokenPair({
    user, family, familyExpiresAt, ip, userAgent
  });

  return {
    accessToken,
    refreshToken,
    refreshMaxAgeMs,
    user: sanitizeUser(user)
  };
}

async function refresh({ refreshToken, ip, userAgent }) {
  if (!refreshToken) {
    throw new AuthError('Thiếu refresh token', 401, 'MISSING_REFRESH_TOKEN');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthError('Refresh token không hợp lệ hoặc đã hết hạn', 401, 'INVALID_REFRESH_TOKEN');
  }

  const tokenHash = hashToken(payload.jti || refreshToken);
  const record = await RefreshToken.findOne({ tokenHash });

  if (!record) {
    throw new AuthError('Refresh token không hợp lệ hoặc không tồn tại', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (record.revokedAt) {
    // Phát hiện token bị tái sử dụng -> thu hồi toàn bộ token family để bảo vệ người dùng
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
    const tokenHash = hashToken(payload.jti || refreshToken);
    await RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  } catch {
    const tokenHash = hashToken(refreshToken);
    await RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  }
}

module.exports = {
  AuthError,
  sanitizeUser,
  login,
  refresh,
  logout,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS
};