const authService = require('../services/auth.service');
const { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } = require('../utils/cookie.util');
const { ok, fail } = require('../utils/apiResponse');
const { loginSchema } = require('../validators/auth.validator');

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR');
  }

  try {
    const { accessToken, refreshToken, refreshMaxAgeMs, user } = await authService.login({
      email: parsed.data.email,
      password: parsed.data.password,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    setAuthCookies(res, { accessToken, refreshToken, refreshMaxAgeMs });
    return ok(res, { user });
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return fail(res, err.status, err.message, err.code);
    }
    throw err;
  }
}

async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];

  try {
    const { accessToken, refreshToken, refreshMaxAgeMs } = await authService.refresh({
      refreshToken: token,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    setAuthCookies(res, { accessToken, refreshToken, refreshMaxAgeMs });
    return ok(res, { message: 'Refresh thành công' });
  } catch (err) {
    // Bất kỳ lỗi refresh nào (hết hạn, bị revoke, reuse bị phát hiện...) đều
    // xoá sạch cookie phía client để buộc đăng nhập lại, tránh vòng lặp lỗi.
    clearAuthCookies(res);
    if (err instanceof authService.AuthError) {
      return fail(res, err.status, err.message, err.code);
    }
    throw err;
  }
}

async function logout(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];
  await authService.logout({ refreshToken: token });
  clearAuthCookies(res);
  return ok(res, { message: 'Đã đăng xuất' });
}

module.exports = { login, refresh, logout };