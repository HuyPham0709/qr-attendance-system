const authService = require('../services/auth.service');
const { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } = require('../utils/cookie.util');
const { ok, fail } = require('../utils/apiResponse');
const { loginSchema, twoFactorCodeSchema, twoFactorSetupSchema } = require('../validators/auth.validator');

// Set cookie + trả user CHỈ khi authService trả về token thật (tức không
// rơi vào nhánh requires2FA/requires2FASetup) — dùng chung cho login,
// verify 2FA và confirm setup vì cả 3 đều có thể kết thúc bằng 1 phiên
// đăng nhập thật.
function respondWithSession(res, result) {
  const { accessToken, refreshToken, refreshMaxAgeMs, user } = result;
  setAuthCookies(res, { accessToken, refreshToken, refreshMaxAgeMs });
  return ok(res, { user });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR');
  }

  try {
    const result = await authService.login({
      email: parsed.data.email,
      password: parsed.data.password,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Không set cookie ở 2 nhánh này — CHƯA đăng nhập thật, FE phải đi
    // tiếp qua /2fa/verify hoặc /2fa/setup + /2fa/confirm-setup trước.
    if (result.requires2FA) {
      return ok(res, { requires2FA: true, pendingToken: result.pendingToken });
    }
    if (result.requires2FASetup) {
      return ok(res, { requires2FASetup: true, pendingToken: result.pendingToken });
    }

    return respondWithSession(res, result);
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return fail(res, err.status, err.message, err.code);
    }
    throw err;
  }
}

async function verify2FA(req, res) {
  const parsed = twoFactorCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR');
  }

  try {
    const result = await authService.verify2FALogin({
      pendingToken: parsed.data.pendingToken,
      code: parsed.data.code,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    return respondWithSession(res, result);
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return fail(res, err.status, err.message, err.code);
    }
    throw err;
  }
}

async function setup2FA(req, res) {
  const parsed = twoFactorSetupSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR');
  }

  try {
    const { qrCodeDataUrl, secret } = await authService.setup2FA({
      pendingToken: parsed.data.pendingToken
    });
    // secret text trả kèm QR để user có thể gõ tay vào app xác thực nếu
    // máy/điện thoại không quét được QR (fallback chuẩn của mọi app 2FA).
    return ok(res, { qrCodeDataUrl, secret });
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return fail(res, err.status, err.message, err.code);
    }
    throw err;
  }
}

async function confirmSetup2FA(req, res) {
  const parsed = twoFactorCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR');
  }

  try {
    const result = await authService.confirm2FASetup({
      pendingToken: parsed.data.pendingToken,
      code: parsed.data.code,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    return respondWithSession(res, result);
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

module.exports = { login, verify2FA, setup2FA, confirmSetup2FA, refresh, logout };