// server/src/services/qrEngine.service.js
//
// QR Engine: sinh token cho từng attendee + verify khi quét.
//
// THAY ĐỔI so với bản trước: bản cũ chỉ base64url-encode payload
// (attendeeId.eventId.version.expiresAt) rồi ký HMAC — base64url encode
// được (không phải mã hoá), nên bất kỳ ai scan/chụp được ảnh QR đều decode
// ra attendeeId/eventId thật, dù không giả mạo được chữ ký. Vi phạm yêu
// cầu "không lộ ID thật" trong spec.
//
// Bản này thêm 1 lớp MÃ HOÁ AES-256-GCM bọc ngoài, dùng key suy ra CHỈ TỪ
// QR_SIGNING_SECRET (secret hệ thống, KHÔNG dùng qrSecret riêng của
// attendee cho lớp mã hoá — lý do: cần giải mã được để biết attendeeId
// nào TRƯỚC KHI query DB lấy qrSecret của chính attendee đó, nên lớp mã
// hoá không thể phụ thuộc ngược vào qrSecret).
//
// Kết quả 2 lớp bảo vệ tách biệt, đúng nguyên tắc "mỗi lớp lo 1 việc":
//   - MÃ HOÁ (AES-256-GCM, key = hash(QR_SECRET)): đảm bảo TÍNH BÍ MẬT —
//     không ai thiếu QR_SIGNING_SECRET đọc được attendeeId/eventId thật.
//   - CHỮ KÝ (HMAC-SHA256, key = QR_SECRET + qrSecret riêng attendee,
//     giữ nguyên logic bản cũ): đảm bảo TÍNH TOÀN VẸN/CHỐNG GIẢ MẠO —
//     kể cả người có QR_SIGNING_SECRET (vd đọc được source/env) cũng
//     không tự tạo được QR hợp lệ cho 1 attendee nếu không có luôn
//     qrSecret riêng (field select:false, chỉ nằm trong DB) của người đó.
//
// LƯU Ý RỦI RO CÒN LẠI (chấp nhận được, ghi rõ để biết): ai có
// QR_SIGNING_SECRET (vd rò rỉ biến env) sẽ ĐỌC được attendeeId/eventId
// của mọi QR đã phát hành (dù vẫn không tạo/giả mạo được QR mới hợp lệ
// nếu thiếu qrSecret riêng). Đây là đánh đổi cố hữu khi muốn token vẫn
// "tự chứa" (self-contained, không cần DB lookup để routing) — nếu muốn
// loại bỏ hoàn toàn rủi ro này, cần chuyển sang token ngẫu nhiên đối
// chiếu DB (không nhúng ID gì cả), đổi lại mất khả năng routing offline
// và cần thêm 1 lượt query DB nữa. Ngoài phạm vi sửa lần này.

const crypto = require('crypto');

const QR_SECRET = process.env.QR_SIGNING_SECRET;

if (!QR_SECRET) {
  console.warn(
    '[qrEngine.service] CẢNH BÁO: thiếu biến env QR_SIGNING_SECRET. ' +
      'Đặt biến này trong .env trước khi chạy production.'
  );
}

// AES-256-GCM cần đúng key 32 byte; QR_SIGNING_SECRET trong .env là chuỗi
// tuỳ ý (độ dài không cố định) nên hash SHA-256 về đúng 32 byte.
const ENC_KEY = QR_SECRET ? crypto.createHash('sha256').update(QR_SECRET).digest() : null;
const GCM_IV_LENGTH = 12; // chuẩn khuyến nghị cho GCM
const GCM_TAG_LENGTH = 16;

function assertEncKeyReady() {
  if (!ENC_KEY) {
    throw new Error('Thiếu QR_SIGNING_SECRET, không thể sinh/giải mã QR token.');
  }
}

/**
 * Sinh 1 secret ngẫu nhiên riêng cho từng attendee.
 * Gọi hàm này khi tạo attendee mới, lưu vào field qrSecret (select: false).
 */
function generateQrSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function signPayload(payload, qrSecret) {
  return crypto
    .createHmac('sha256', QR_SECRET + qrSecret)
    .update(payload)
    .digest('hex')
    .slice(0, 24);
}

function encrypt(plaintext) {
  assertEncKeyReady();
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Gói gọn: IV || authTag || ciphertext, base64url toàn bộ thành 1 chuỗi
  // duy nhất để dùng làm nội dung QR.
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64url');
}

/** @returns {string|null} plaintext nếu giải mã + xác thực GCM tag OK, null nếu token hỏng/bị sửa/sai key */
function decrypt(token) {
  assertEncKeyReady();
  try {
    const packed = Buffer.from(token, 'base64url');
    if (packed.length < GCM_IV_LENGTH + GCM_TAG_LENGTH) return null;

    const iv = packed.subarray(0, GCM_IV_LENGTH);
    const authTag = packed.subarray(GCM_IV_LENGTH, GCM_IV_LENGTH + GCM_TAG_LENGTH);
    const ciphertext = packed.subarray(GCM_IV_LENGTH + GCM_TAG_LENGTH);

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv);
    decipher.setAuthTag(authTag); // sai tag (token bị sửa) -> decipher.final() throw
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Sinh mã QR (token) cho 1 attendee. Chữ ký API giữ nguyên như bản cũ —
 * mọi nơi gọi hàm này (Attendee.model.js hook, qr.controller.js) không
 * cần đổi gì.
 *
 * @param {Object} params
 * @param {string} params.attendeeId
 * @param {string} params.eventId
 * @param {string} params.qrSecret
 * @param {number} [params.version=1]
 * @param {number} [params.ttlMinutes=0]
 * @returns {string} token base64url, dùng làm nội dung QR
 */
function generateQRToken({ attendeeId, eventId, qrSecret, version = 1, ttlMinutes = 0 }) {
  if (!attendeeId || !eventId || !qrSecret) {
    throw new Error('generateQRToken thiếu attendeeId/eventId/qrSecret');
  }

  const expiresAt = ttlMinutes > 0 ? Date.now() + ttlMinutes * 60_000 : 0;
  const payload = `${attendeeId}.${eventId}.${version}.${expiresAt}`;
  const signature = signPayload(payload, qrSecret);
  const signedPayload = `${payload}.${signature}`;

  return encrypt(signedPayload);
}

/**
 * Xác thực token quét được từ QR — verify cả 2 lớp (giải mã GCM + chữ ký HMAC).
 *
 * @param {string} token
 * @param {Object} params
 * @param {string} params.qrSecret - qrSecret riêng của attendee tương ứng
 * @returns {{valid:boolean, reason?:string, attendeeId?:string, eventId?:string, version?:number}}
 */
function verifyQRToken(token, { qrSecret }) {
  const signedPayload = decrypt(token);
  if (!signedPayload) return { valid: false, reason: 'malformed' };

  const parts = signedPayload.split('.');
  if (parts.length !== 5) return { valid: false, reason: 'malformed' };

  const [attendeeId, eventId, version, expiresAt, signature] = parts;
  const payload = `${attendeeId}.${eventId}.${version}.${expiresAt}`;
  const expectedSig = signPayload(payload, qrSecret);

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
}

/**
 * Giải mã "thô" chỉ để lấy attendeeId/eventId dùng cho ROUTING (biết cần
 * fetch attendee nào từ DB) — dùng lớp mã hoá hệ thống (QR_SECRET), CHƯA
 * cần qrSecret riêng của attendee (vì mục đích chỉ để biết fetch ai).
 *
 * QUAN TRỌNG: hàm này giải mã được payload nhưng KHÔNG xác thực chữ ký
 * HMAC (lớp 2, cần qrSecret riêng) — KHÔNG được dùng để ra quyết định
 * check-in. Chỉ dùng để routing rồi bắt buộc gọi verifyQRToken() đầy đủ
 * sau khi đã có qrSecret thật từ DB.
 *
 * @returns {{attendeeId: string, eventId: string} | null}
 */
function decodeRoutingInfo(token) {
  const signedPayload = decrypt(token);
  if (!signedPayload) return null;

  const parts = signedPayload.split('.');
  if (parts.length !== 5) return null;

  const [attendeeId, eventId] = parts;
  if (!attendeeId || !eventId) return null;
  return { attendeeId, eventId };
}

module.exports = { generateQrSecret, generateQRToken, verifyQRToken, decodeRoutingInfo };