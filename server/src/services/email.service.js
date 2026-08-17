// server/src/services/email.service.js
//
// Email service để gửi QR, confirmations
// Hiện tại dùng console.log mock (không setup nodemailer vì free tier)
// Để production: thay thế bằng nodemailer + SMTP (Gmail, SendGrid...)

async function sendQRCode({ email, attendeeId, eventName, qrDataUrl }) {
  try {
    const subject = `Vé tham dự sự kiện: ${eventName}`;
    const htmlBody = `
      <h2>Xác nhận đăng ký sự kiện</h2>
      <p>Bạn đã đăng ký tham dự sự kiện: <strong>${eventName}</strong></p>
      <p>Dưới đây là mã QR để quét vào cổng:</p>
      <img src="${qrDataUrl}" alt="QR Code" style="max-width: 300px;">
      <p>
        <strong>Lưu ý:</strong> 
        <ul>
          <li>Hãy lưu email này để không mất mã QR</li>
          <li>Bạn có thể lấy lại mã QR bằng cách truy cập trang tra cứu vé</li>
          <li>Mã QR này dành riêng cho bạn, không được chia sẻ</li>
        </ul>
      </p>
    `;

    // TODO: Thay thế bằng nodemailer/SendGrid
    console.log(`📧 [MOCK EMAIL] Gửi QR cho ${email}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${htmlBody.substring(0, 100)}...`);

    return { success: true, message: 'Email sent (mock)' };
  } catch (error) {
    console.error('sendQRCode error:', error);
    return { success: false, message: error.message };
  }
}

async function sendConfirmation({ email, eventName, checkInAt }) {
  try {
    const subject = `Xác nhận check-in: ${eventName}`;
    const htmlBody = `
      <h2>Cảm ơn đã tham dự!</h2>
      <p>Bạn đã check-in thành công tại sự kiện <strong>${eventName}</strong></p>
      <p>Thời gian check-in: <strong>${new Date(checkInAt).toLocaleString('vi-VN')}</strong></p>
    `;

    console.log(`📧 [MOCK EMAIL] Gửi xác nhận check-in cho ${email}`);
    console.log(`   Subject: ${subject}`);

    return { success: true, message: 'Confirmation email sent (mock)' };
  } catch (error) {
    console.error('sendConfirmation error:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  sendQRCode,
  sendConfirmation
};
