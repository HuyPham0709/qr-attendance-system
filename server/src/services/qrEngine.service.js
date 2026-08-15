// server/src/services/qrEngine.service.js
//
// QR Engine: sinh token cho từng attendee + verify khi quét.
// Bảo mật 2 lớp: HMAC dùng (secret hệ thống + secret riêng của attendee),
// nên dù lộ QR_SIGNING_SECRET (biến env chung) cũng KHÔNG đủ để giả mạo
// token của 1 attendee cụ thể nếu không có luôn qrSecret của người đó
// (field select:false, không bao giờ trả về client).

const crypto = require('crypto');

const QR_SECRET = process.env.QR_SIGNING_SECRET;

if (!QR_SECRET) {
  // Fail fast: thiếu biến này thì mọi token sinh ra đều không an toàn.
  // Không throw ở đây để tránh crash lúc require file trong môi trường
  // test chưa set env, nhưng log cảnh báo rõ ràng.
  console.warn(
    '[qrEngine.service] CẢNH BÁO: thiếu biến env QR_SIGNING_SECRET. ' +
      'Đặt biến này trong .env trước khi chạy production.'
  );
}

/**
 * Sinh 1 secret ngẫu nhiên riêng cho từng attendee.
 * Gọi hàm này khi tạo attendee mới, lưu vào field qrSecret (select: false).
 */
function generateQrSecret() {
  return crypto.randomBytes(32).toString('hex'); // 64 ký tự hex
}

/**
 * Sinh mã QR (token) cho 1 attendee.
 *
 * Cấu trúc payload: <attendeeId>.<eventId>.<version>.<expiresAt|0>
 * Chữ ký HMAC-SHA256 dùng (QR_SECRET + qrSecret riêng attendee) đảm bảo
 * không ai giả mạo được payload nếu không có cả 2 secret.
 *
 * @param {Object} params
 * @param {string} params.attendeeId
 * @param {string} params.eventId
 * @param {string} params.qrSecret   - qrSecret riêng của attendee (lấy từ DB, select:false)
 * @param {number} [params.version=1] - qrVersion hiện tại của attendee, dùng để revoke
 * @param {number} [params.ttlMinutes=0] - >0 = token hết hạn sau N phút (rotating QR)
 * @returns {string} token đã encode base64url, dùng làm nội dung QR
 */
function generateQRToken({ attendeeId, eventId, qrSecret, version = 1, ttlMinutes = 0 }) {
  if (!attendeeId || !eventId || !qrSecret) {
    throw new Error('generateQRToken thiếu attendeeId/eventId/qrSecret');
  }

  const expiresAt = ttlMinutes > 0 ? Date.now() + ttlMinutes * 60_000 : 0;
  const payload = `${attendeeId}.${eventId}.${version}.${expiresAt}`;

  const signature = crypto
    .createHmac('sha256', QR_SECRET + qrSecret)
    .update(payload)
    .digest('hex')
    .slice(0, 24); // rút gọn cho QR nhỏ gọn hơn, vẫn đủ khó brute-force

  const rawToken = `${payload}.${signature}`;
  return Buffer.from(rawToken).toString('base64url');
}

/**
 * Xác thực token quét được từ QR.
 *
 * @param {string} token
 * @param {Object} params
 * @param {string} params.qrSecret - qrSecret riêng của attendee tương ứng (đã lookup theo attendeeId trong token)
 * @returns {{valid:boolean, reason?:string, attendeeId?:string, eventId?:string, version?:number}}
 */
function verifyQRToken(token, { qrSecret }) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split('.');
    if (parts.length !== 5) return { valid: false, reason: 'malformed' };

    const [attendeeId, eventId, version, expiresAt, signature] = parts;
    const payload = `${attendeeId}.${eventId}.${version}.${expiresAt}`;

    const expectedSig = crypto
      .createHmac('sha256', QR_SECRET + qrSecret)
      .update(payload)
      .digest('hex')
      .slice(0, 24);

    // So sánh độ dài trước — timingSafeEqual throw nếu 2 buffer khác length,
    // và bản thân việc throw/catch cũng không được để lộ timing khác biệt
    // đáng kể so với so sánh thường, nên check length trước là an toàn.
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) {
      return { valid: false, reason: 'invalid_signature' };
    }

    const sigMatch = crypto.timingSafeEqual(sigBuf, expectedBuf);
    if (!sigMatch) return { valid: false, reason: 'invalid_signature' };

    if (Number(expiresAt) > 0 && Date.now() > Number(expiresAt)) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true, attendeeId, eventId, version: Number(version) };
  } catch (err) {
    return { valid: false, reason: 'malformed' };
  }
}

module.exports = { generateQrSecret, generateQRToken, verifyQRToken };