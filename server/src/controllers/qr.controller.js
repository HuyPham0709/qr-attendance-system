// server/src/controllers/qr.controller.js
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const Attendee = require('../models/Attendee.model');
const Event = require('../models/Event.model');
const { generateQRToken } = require('../services/qrEngine.service');

/**
 * GET /api/attendees/:id/qr?format=png|svg|dataurl
 *
 * Trả ảnh QR của 1 attendee.
 *
 * Quy tắc chọn token để render:
 * - Event KHÔNG bật rotating QR (settings.qrTokenTTLMinutes = 0):
 *   dùng attendee.qrCode đã lưu sẵn trong DB (sinh 1 lần lúc tạo attendee,
 *   xem hook pre-validate trong Attendee.model.js) — ảnh QR luôn giống
 *   nhau qua các lần gọi, khớp với mã đã gửi email lúc đăng ký.
 * - Event CÓ bật rotating QR (settings.qrTokenTTLMinutes > 0):
 *   sinh token MỚI mỗi lần gọi endpoint này (không ghi lại vào DB), vì
 *   mục đích của rotating QR là ảnh đổi liên tục chống chụp màn hình
 *   chia sẻ — client (app hiển thị QR cho người dùng tự quét) phải tự
 *   gọi lại endpoint này định kỳ để lấy ảnh mới.
 */
async function getAttendeeQr(req, res) {
  try {
    const { id } = req.params;
    const format = (req.query.format || 'png').toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'attendeeId không hợp lệ' });
    }

    // qrSecret là select:false trong schema, phải xin rõ mới lấy được
    const attendee = await Attendee.findById(id).select('+qrSecret');
    if (!attendee) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy attendee' });
    }

    const event = await Event.findById(attendee.eventId).select('settings');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy event của attendee này' });
    }

    const ttlMinutes = event.settings?.qrTokenTTLMinutes || 0;
    const isRotating = ttlMinutes > 0;

    let token;

    if (isRotating) {
      // Rotating QR: luôn sinh mới, không đụng DB
      token = generateQRToken({
        attendeeId: attendee._id.toString(),
        eventId: attendee.eventId.toString(),
        qrSecret: attendee.qrSecret,
        version: attendee.qrVersion,
        ttlMinutes
      });
    } else {
      // Non-rotating: dùng token đã lưu sẵn; nếu vì lý do gì đó chưa có
      // (vd data cũ tạo trước khi có hook, hoặc insertMany bỏ qua hook)
      // thì sinh bù và lưu lại 1 lần.
      token = attendee.qrCode;
      if (!token) {
        token = generateQRToken({
          attendeeId: attendee._id.toString(),
          eventId: attendee.eventId.toString(),
          qrSecret: attendee.qrSecret,
          version: attendee.qrVersion,
          ttlMinutes: 0
        });
        attendee.qrCode = token;
        await attendee.save();
      }
    }

    if (format === 'dataurl') {
      const dataUrl = await QRCode.toDataURL(token, { margin: 1, width: 320 });
      return res.json({ success: true, data: { dataUrl } });
    }

    if (format === 'svg') {
      const svg = await QRCode.toString(token, { type: 'svg', margin: 1, width: 320 });
      res.set('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }

    // Mặc định: PNG
    const pngBuffer = await QRCode.toBuffer(token, { type: 'png', margin: 1, width: 320 });
    res.set('Content-Type', 'image/png');
    return res.send(pngBuffer);
  } catch (error) {
    console.error('Lỗi khi lấy QR attendee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/attendees/:id/qr/revoke
 *
 * Vô hiệu QR cũ (mọi bản đã in/gửi email trước đó) và phát hành lại QR mới
 * cho cùng attendee. Dùng khi: người tham dự báo mất/lộ vé, đổi vé, hoặc
 * ban tổ chức nghi ngờ ảnh QR đã bị chia sẻ.
 *
 * Cơ chế: tăng qrVersion lên 1. Vì verifyQRToken() so sánh version nằm
 * trong token với qrVersion hiện tại trong DB (xem checkin.service.js),
 * bất kỳ QR nào mang version cũ sẽ verify ra reason 'revoked' ngay cả khi
 * chữ ký HMAC của nó vẫn đúng toán học — không cần đổi qrSecret, không
 * cần blacklist token cũ ở đâu cả, chỉ 1 phép so sánh số nguyên.
 *
 * LƯU Ý RACE CONDITION: bước tăng qrVersion dùng $inc (atomic ở tầng
 * Mongo) nên 2 request revoke cùng lúc sẽ không bị mất 1 lần tăng. Nhưng
 * bước ghi lại qrCode mới (dòng dưới) là 1 update riêng, KHÔNG cùng 1
 * atomic operation với bước tăng version — nếu có 2 request revoke gần
 * như đồng thời, qrCode lưu cuối cùng trong DB có thể không khớp với
 * qrVersion mới nhất (request nào ghi qrCode sau sẽ thắng). Vì revoke là
 * thao tác admin, tần suất thấp, mình chấp nhận rủi ro này ở bản hiện tại
 * thay vì bọc thêm Redis lock (để dành pattern đó cho checkin.service.js,
 * nơi bắt buộc phải xử lý vì tần suất quét rất cao).
 */
async function revokeAttendeeQr(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'attendeeId không hợp lệ' });
    }

    // Atomic increment — không đọc rồi ghi lại (tránh mất update khi có
    // 2 request revoke cùng lúc).
    const attendee = await Attendee.findByIdAndUpdate(
      id,
      { $inc: { qrVersion: 1 } },
      { new: true }
    ).select('+qrSecret');

    if (!attendee) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy attendee' });
    }

    const newQrCode = generateQRToken({
      attendeeId: attendee._id.toString(),
      eventId: attendee.eventId.toString(),
      qrSecret: attendee.qrSecret,
      version: attendee.qrVersion,
      ttlMinutes: 0
    });

    attendee.qrCode = newQrCode;
    await attendee.save();

    return res.json({
      success: true,
      message: 'Đã thu hồi QR cũ và phát hành QR mới.',
      data: {
        attendeeId: attendee._id,
        qrVersion: attendee.qrVersion
      }
    });
  } catch (error) {
    console.error('Lỗi khi revoke QR attendee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getAttendeeQr, revokeAttendeeQr };