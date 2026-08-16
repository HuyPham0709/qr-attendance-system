const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require('../utils/token.util');

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class AuthError extends Error {
  constructor(status, message, code = 'AUTH_ERROR') {
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

function makeFamilyId() {
  return crypto.randomBytes(16).toString('hex');
}

function buildRefreshRecord({ userId, family, refreshToken, ip, userAgent }) {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  return {
    userId,
    family,
    tokenHash: hashToken(refreshToken),
    familyExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    expiresAt,
    createdByIp: ip,
    userAgent
  };
}

async function login({ email, password, ip, userAgent }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new AuthError(400, 'Email và mật khẩu là bắt buộc', 'INVALID_INPUT');
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw new AuthError(401, 'Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AuthError(403, 'Tài khoản đã bị vô hiệu hóa', 'ACCOUNT_DISABLED');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AuthError(401, 'Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
  }

  const family = makeFamilyId();
  const { token: refreshToken, jti } = signRefreshToken({
    userId: user._id.toString(),
    family,
    expiresInSeconds: Math.floor(REFRESH_TOKEN_TTL_MS / 1000)
  });

  await RefreshToken.create({
    userId: user._id,
    family,
    tokenHash: hashToken(refreshToken),
    familyExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    createdByIp: ip,
    userAgent,
    jti
  });

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    organizationId: user.organizationId ? user.organizationId.toString() : null
  });

  return {
    accessToken,
    refreshToken,
    refreshMaxAgeMs: REFRESH_TOKEN_TTL_MS,
    user: sanitizeUser(user)
  };
}

async function refresh({ refreshToken, ip, userAgent }) {
  if (!refreshToken) {
    throw new AuthError(401, 'Refresh token không tồn tại', 'MISSING_REFRESH_TOKEN');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AuthError(401, 'Refresh token không hợp lệ hoặc đã hết hạn', 'INVALID_REFRESH_TOKEN');
  }

  const tokenHash = hashToken(refreshToken);
  const currentToken = await RefreshToken.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  }).lean();

  if (!currentToken) {
    throw new AuthError(401, 'Refresh token không hợp lệ hoặc đã bị thu hồi', 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(currentToken.userId);
  if (!user || !user.isActive) {
    throw new AuthError(401, 'Người dùng không còn hoạt động', 'ACCOUNT_DISABLED');
  }

  const family = currentToken.family;
  const nextRefresh = signRefreshToken({
    userId: user._id.toString(),
    family,
    expiresInSeconds: Math.floor(REFRESH_TOKEN_TTL_MS / 1000)
  });

  await RefreshToken.updateOne(
    { _id: currentToken._id },
    {
      $set: {
        revokedAt: new Date(),
        replacedByHash: hashToken(nextRefresh.token),
        updatedAt: new Date()
      }
    }
  );

  await RefreshToken.create({
    userId: user._id,
    family,
    tokenHash: hashToken(nextRefresh.token),
    familyExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    createdByIp: ip,
    userAgent
  });

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    organizationId: user.organizationId ? user.organizationId.toString() : null
  });

  return {
    accessToken,
    refreshToken: nextRefresh.token,
    refreshMaxAgeMs: REFRESH_TOKEN_TTL_MS
  };
}

async function logout({ refreshToken }) {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);
  await RefreshToken.updateMany(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
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
