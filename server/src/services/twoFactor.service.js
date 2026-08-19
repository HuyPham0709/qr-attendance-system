// server/src/services/twoFactor.service.js
//
// 2FA THẬT dùng chuẩn TOTP (RFC 6238) — giống cách Google Authenticator /
// Authy / hầu hết app 2FA ngoài đời hoạt động: server và app điện thoại
// CÙNG giữ 1 secret bí mật, mỗi bên tự tính mã 6 số dựa trên
// (secret + thời gian hiện tại, làm tròn theo bước 30 giây) — không ai
// cần gửi secret qua lại sau bước setup ban đầu, nên mã luôn đổi mỗi 30s
// mà không cần server chủ động "gửi" mã nào cả.
//
// Thay hẳn cho kiểu cũ so sánh cứng `code === '123456'` phía client (vừa
// không đổi mã, vừa kiểm tra ở FE nên ai mở devtools cũng bypass được).

const { authenticator } = require('otplib');
const QRCode = require('qrcode');

// window: 1 -> chấp nhận mã của bước liền trước/sau (lệch ~30s) để tránh
// lỗi do đồng hồ điện thoại/server lệch nhẹ, vẫn là hành vi chuẩn của
// hầu hết thư viện TOTP phổ biến.
authenticator.options = { window: 1 };

const ISSUER = 'QR Attendance System';

/** Sinh 1 secret base32 ngẫu nhiên mới cho 1 lượt setup 2FA. */
function generateSecret() {
  return authenticator.generateSecret();
}

/** Chuẩn otpauth:// URI để app xác thực (Google Authenticator...) đọc được. */
function buildOtpAuthUri(email, secret) {
  return authenticator.keyuri(email, ISSUER, secret);
}

/** Render otpauth URI thành ảnh QR dạng data URL (base64 PNG) để FE hiển thị. */
async function generateQrCodeDataUrl(otpAuthUri) {
  return QRCode.toDataURL(otpAuthUri);
}

/** So khớp mã 6 số người dùng nhập với secret đang lưu. */
function verifyCode(code, secret) {
  if (!code || !secret) return false;
  try {
    return authenticator.verify({ token: String(code), secret });
  } catch {
    // otplib throw nếu token sai định dạng (vd không phải 6 chữ số) —
    // coi như sai mã, không phải lỗi hệ thống.
    return false;
  }
}

module.exports = { generateSecret, buildOtpAuthUri, generateQrCodeDataUrl, verifyCode };
