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
// Content-ID cố định cho ảnh QR đính kèm — chỉ cần khớp giữa attachments[].cid
// và "cid:<id>" trong HTML, giá trị cụ thể không quan trọng.
const QR_CID = 'qr-checkin-image';

/**
 * Dựng HTML email dạng "vé điện tử" chuyên nghiệp — dùng <table> + inline
 * style thay vì flexbox/<style> block, vì Gmail/Outlook bóc CSS hiện đại và
 * nhiều client (đặc biệt Outlook desktop dùng engine Word) chỉ render đúng
 * layout dựa trên bảng lồng bảng theo chuẩn email HTML cũ. Toàn bộ text do
 * hệ thống tạo (event.name, attendee.fullName...) — không có input tự do
 * của người dùng cuối chèn trực tiếp vào HTML này ngoài họ tên lúc đăng ký,
 * chấp nhận được vì đây là email nội bộ 1-1 gửi đúng người đó, không phải
 * nội dung hiển thị công khai.
 */
function buildTicketEmailHtml({ event, attendee, eventTime, address, subjectPrefix }) {
  const brand = '#4f46e5'; // indigo-600 — khớp màu thương hiệu bên client-attendee
  const ticketCodeRow = attendee.ticketCode
    ? `<tr>
         <td style="padding:10px 0;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Mã vé</td>
         <td style="padding:10px 0;border-top:1px solid #e5e7eb;font-size:15px;font-weight:700;color:#111827;text-align:right;letter-spacing:.15em;font-family:monospace;">${attendee.ticketCode}</td>
       </tr>`
    : '';

  return `
<div style="background-color:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background:${brand};padding:28px 32px;">
        <p style="margin:0;color:#c7d2fe;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">${subjectPrefix}</p>
        <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:800;line-height:1.3;">${event.name}</h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 8px;font-size:15px;color:#111827;">
          Xin chào <strong>${attendee.fullName}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.6;">
          Bạn đã đăng ký tham dự thành công. Vui lòng xuất trình mã QR bên dưới tại cổng để check-in.
        </p>

        <!-- Ticket info card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Thời gian</td>
            <td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;text-align:right;">${eventTime}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;vertical-align:top;">Địa điểm</td>
            <td style="padding:6px 0;border-top:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#111827;text-align:right;">${address ? address.replace(/^\s*—\s*/, '') : 'Đang cập nhật'}</td>
          </tr>
          ${ticketCodeRow}
        </table>

        <!-- QR code, đóng khung để trông như 1 tấm vé thật -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:8px 0 4px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="border:2px dashed ${brand};border-radius:16px;padding:16px;background:#ffffff;">
                <tr>
                  <td>
                    <img src="cid:${QR_CID}" alt="Mã QR check-in" width="220" height="220" style="display:block;border-radius:8px;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="text-align:center;margin:10px 0 24px;font-size:11px;color:#9ca3af;letter-spacing:.05em;">QUÉT MÃ NÀY TẠI CỔNG ĐỂ CHECK-IN</p>

        <!-- Warning box -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;">
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#92400e;line-height:1.5;">
              <strong>Lưu ý:</strong> mã QR chỉ dùng được 1 lần. Vui lòng không chia sẻ ảnh này cho người khác để tránh mất suất tham dự.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
          Email được gửi tự động từ hệ thống đăng ký sự kiện — vui lòng không trả lời email này.
        </p>
      </td>
    </tr>
  </table>
</div>`;
}

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

  const html = buildTicketEmailHtml({ event, attendee, eventTime, address, subjectPrefix });

  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      `[email.service] DEV-MODE (chưa cấu hình SMTP_HOST) — email lẽ ra đã gửi tới ${attendee.email}:\n` +
        `  Subject: ${subject}\n` +
        `  QR (data URL, có thể dán vào trình duyệt để xem): ${qrDataUrl.slice(0, 60)}...\n`
    );
    return { devMode: true };
  }

  // QUAN TRỌNG: Gmail và phần lớn email client CHẶN/BÓC ảnh dạng
  // "data:image/...;base64,..." đặt thẳng trong src (coi là rủi ro bảo
  // mật/spam) — bản trước dùng cách này nên email gửi thật vẫn tới hộp thư
  // nhưng ảnh QR hiện ra là icon vỡ, không thấy gì. Cách chuẩn được mọi
  // email client hỗ trợ: convert base64 thành Buffer, gửi kèm như 1
  // attachment có "cid" (Content-ID), rồi HTML chỉ trỏ tới "cid:<id>" thay
  // vì nhúng data thẳng vào — email client sẽ tự khớp ảnh đính kèm vào chỗ
  // đó khi hiển thị.
  const base64Match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(qrDataUrl);
  const attachments = base64Match
    ? [
        {
          filename: 'ma-qr-checkin.png',
          content: Buffer.from(base64Match[2], 'base64'),
          contentType: base64Match[1],
          cid: QR_CID
        }
      ]
    : [];

  if (!base64Match) {
    console.warn(
      '[email.service] qrDataUrl không đúng định dạng data:image/...;base64,... — gửi email KHÔNG kèm ảnh QR.'
    );
  }

  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to: attendee.email,
    subject,
    text,
    html,
    attachments
  });

  return { devMode: false, messageId: info.messageId };
}

module.exports = { sendTicketQrEmail };
