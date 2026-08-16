const isProd = process.env.NODE_ENV === 'production';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || isProd;

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000; // phải khớp ACCESS_TOKEN_TTL trong token.util.js

function setAuthCookies(res, { accessToken, refreshToken, refreshMaxAgeMs }) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'strict',
    path: '/',
    maxAge: ACCESS_MAX_AGE_MS
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'strict',
    // Thu hẹp phạm vi: cookie này chỉ được trình duyệt gửi kèm khi gọi đúng /api/auth/*.
    // Nếu có XSS ở 1 trang khác trong app, request tới các API khác (vd /api/events)
    // sẽ không tự động kèm refresh token.
    path: '/api/auth',
    maxAge: refreshMaxAgeMs
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

module.exports = { setAuthCookies, clearAuthCookies, ACCESS_COOKIE, REFRESH_COOKIE };