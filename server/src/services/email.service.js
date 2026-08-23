// server/src/services/email.service.js
//
// Gửi email chứa mã QR cho attendee sau khi đăng ký / khi tra cứu lại vé
// (spec mục 1.4 + 2.1.7). Phạm vi CORE, không làm chức năng nâng cao
// (không SMS, không template phức tạp, không hàng đợi retry).
//
// THIẾT KẾ "DEV-MODE FALLBACK": mỗi thành viên tự chạy project trên máy
// riêng (README mục 4 của kiến trúc), phần lớn sẽ CHƯA có SMTP thật trong
// .env lúc mới clone. Nếu để service này throw khi thiếu SMTP_*, cả luồng
// đăng ký (vốn không chỉ gửi email mà còn tạo attendee + trừ vé) sẽ fail
// theo dây chuyền chỉ vì thiếu cấu hình mail — trải nghiệm dev rất tệ.
// => Nếu thiếu biến SMTP_HOST, hàm KHÔNG throw: chỉ log rõ nội dung email
//    (kèm link QR) ra console và trả về { devMode: true }. Khi đã điền đủ
//    SMTP_* thật trong .env, tự động chuyển sang gửi mail thật qua
//    nodemailer, không cần đổi code ở nơi gọi (attendee.service.js).
//
// Cần: npm install nodemailer (thêm vào server/package.json).

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || 'QR Attendance <no-reply@qr-attendance.local>';

let cachedTransporter;

/** Lazy-load nodemailer để service vẫn require() được kể cả khi package chưa cài (dev chưa chạy npm install). */
function getTransporter() {
  if (!SMTP_HOST) return null;
  if (cachedTransporter) return cachedTransporter;

  let nodemailer;
  try {
    // eslint-disable-next-line global-require
    nodemailer = require('nodemailer');
  } catch {
    console.warn(
      '[email.service] Đã cấu hình SMTP_HOST nhưng thiếu package "nodemailer". ' +
        'Chạy `npm install nodemailer` trong server/. Tạm thời fallback sang dev-mode (chỉ log ra console).'
    );
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  });
  return cachedTransporter;
}

/**
 * @param {Object} params
 * @param {{name:string,startAt:Date,location?:{address?:string}}} params.event
 * @param {{fullName:string,email:string}} params.attendee
 * @param {string} params.qrDataUrl - data:image/png;base64,... (dùng làm inline attachment)
 * @param {string} [params.subjectPrefix] - vd 'Vé của bạn' hoặc 'Gửi lại vé'
 * @returns {Promise<{devMode:boolean, messageId?:string}>}
 */
async function sendTicketQrEmail({ event, attendee, qrDataUrl, subjectPrefix = 'Vé tham dự' }) {
  const subject = `${subjectPrefix}: ${event.name}`;
  const eventTime = event.startAt ? new Date(event.startAt).toLocaleString('vi-VN') : '';
  const address = event.location?.address ? ` — ${event.location.address}` : '';

  const text =
    `Xin chào ${attendee.fullName},\n\n` +
    `Bạn đã đăng ký tham dự "${event.name}" (${eventTime}${address}).\n` +
    `Vui lòng xuất trình mã QR đính kèm tại cổng để check-in.\n` +
    `Lưu ý: mã QR chỉ dùng được 1 lần, vui lòng không chia sẻ cho người khác.\n\n` +
    `Trân trọng.`;

  const html =
    `<p>Xin chào <strong>${attendee.fullName}</strong>,</p>` +
    `<p>Bạn đã đăng ký tham dự <strong>${event.name}</strong> (${eventTime}${address}).</p>` +
    `<p>Vui lòng xuất trình mã QR bên dưới tại cổng để check-in:</p>` +
    `<p><img src="${qrDataUrl}" alt="Mã QR check-in" width="240" height="240" /></p>` +
    `<p style="color:#888;font-size:13px">Mã QR chỉ dùng được 1 lần. Vui lòng không chia sẻ ảnh này cho người khác.</p>`;

  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      `[email.service] DEV-MODE (chưa cấu hình SMTP_HOST) — email lẽ ra đã gửi tới ${attendee.email}:\n` +
        `  Subject: ${subject}\n` +
        `  QR (data URL, có thể dán vào trình duyệt để xem): ${qrDataUrl.slice(0, 60)}...\n`
    );
    return { devMode: true };
  }

  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to: attendee.email,
    subject,
    text,
    html
  });

  return { devMode: false, messageId: info.messageId };
}

module.exports = { sendTicketQrEmail };
