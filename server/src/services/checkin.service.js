// server/src/services/checkin.service.js
//
// GIAI ĐOẠN TRƯỚC: chỉ có evaluateCheckIn() — hàm thuần (pure), chưa nối
// DB/API. GIỜ ĐÃ NỐI THẬT qua checkin.controller.js (xem file đó) — lớp
// orchestrator gọi evaluateCheckIn() để LẤY QUYẾT ĐỊNH, rồi tự áp dụng
// atomic update + ghi CheckInLog + cập nhật stats.
//
// evaluateCheckIn() ở dưới GIỮ NGUYÊN là hàm thuần — không tự query DB,
// không tự ghi DB — để giữ được lợi ích unit-test không cần Mongo.

const { verifyQRToken, decodeRoutingInfo } = require('./qrEngine.service');

/** Các outcome khớp đúng enum `result` trong CheckInLog.model.js */
const OUTCOMES = Object.freeze({
  SUCCESS: 'success',
  DUPLICATE: 'duplicate',
  INVALID_QR: 'invalid_qr',
  EXPIRED_QR: 'expired_qr',
  WRONG_GEO: 'wrong_geo',
  REVOKED: 'revoked'
});

const MESSAGES = {
  [OUTCOMES.SUCCESS]: 'Check-in thành công.',
  [OUTCOMES.DUPLICATE]: 'Mã QR này đã được check-in trước đó.',
  [OUTCOMES.INVALID_QR]: 'Mã QR không hợp lệ hoặc bị giả mạo.',
  [OUTCOMES.EXPIRED_QR]: 'Mã QR đã hết hạn.',
  [OUTCOMES.WRONG_GEO]: 'Vị trí quét không nằm trong phạm vi cho phép của sự kiện.',
  [OUTCOMES.REVOKED]: 'Mã QR này đã bị thu hồi. Vui lòng lấy QR mới.'
};

/**
 * Lấy attendeeId/eventId từ token để tầng orchestrator biết cần fetch
 * attendee nào từ DB TRƯỚC KHI có đủ dữ liệu (qrSecret) để verify đầy đủ.
 *
 * THAY ĐỔI: trước đây hàm này tự split base64url-decode token vì token cũ
 * chỉ encode (không mã hoá) — giờ token đã được mã hoá AES-256-GCM
 * (xem qrEngine.service.js), nên phải giải mã bằng đúng hàm của qrEngine
 * thay vì tự parse tay ở đây.
 *
 * QUAN TRỌNG (không đổi): hàm này KHÔNG xác thực chữ ký HMAC (lớp 2,
 * cần qrSecret riêng attendee) — KHÔNG được dùng để ra quyết định
 * check-in, chỉ dùng để routing.
 *
 * @returns {{attendeeId: string, eventId: string} | null} null nếu token malformed
 */
function decodeAttendeeIdFromToken(token) {
  return decodeRoutingInfo(token);
}

/**
 * Khoảng cách giữa 2 toạ độ (mét), công thức Haversine.
 */
function haversineDistanceMeters(a, b) {
  const R = 6371000; // bán kính Trái Đất (m)
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/**
 * HÀM QUYẾT ĐỊNH CHÍNH — thuần (pure), không side-effect. Không đổi so
 * với bản trước (verifyQRToken vẫn cùng chữ ký gọi, chỉ đổi bên trong).
 *
 * @param {Object} params
 * @param {string} params.token
 * @param {Object} params.attendee - attendee đã load từ DB, PHẢI có field qrSecret
 * @param {Object} params.event
 * @param {{lat:number, lng:number}} [params.geo]
 * @param {number} [params.now]
 *
 * @returns {{
 *   outcome: string, reason: string, message: string,
 *   attendeeId: string|null, eventId: string|null, patch: Object|null
 * }}
 */
function evaluateCheckIn({ token, attendee, event, geo, now = Date.now() }) {
  if (!attendee) {
    return {
      outcome: OUTCOMES.INVALID_QR,
      reason: 'attendee_not_found',
      message: 'Mã QR không hợp lệ hoặc không tồn tại.',
      attendeeId: null,
      eventId: null,
      patch: null
    };
  }

  const verifyResult = verifyQRToken(token, { qrSecret: attendee.qrSecret });

  if (!verifyResult.valid) {
    const outcome = verifyResult.reason === 'expired' ? OUTCOMES.EXPIRED_QR : OUTCOMES.INVALID_QR;
    return {
      outcome,
      reason: verifyResult.reason,
      message: MESSAGES[outcome],
      attendeeId: attendee._id ? String(attendee._id) : null,
      eventId: null,
      patch: null
    };
  }

  const attendeeId = String(attendee._id);
  const eventId = String(attendee.eventId);

  if (verifyResult.eventId !== eventId) {
    return {
      outcome: OUTCOMES.INVALID_QR,
      reason: 'event_mismatch',
      message: MESSAGES[OUTCOMES.INVALID_QR],
      attendeeId,
      eventId,
      patch: null
    };
  }

  if (verifyResult.version !== attendee.qrVersion) {
    return {
      outcome: OUTCOMES.REVOKED,
      reason: 'version_mismatch',
      message: MESSAGES[OUTCOMES.REVOKED],
      attendeeId,
      eventId,
      patch: null
    };
  }

  if (attendee.status === 'cancelled') {
    return {
      outcome: OUTCOMES.REVOKED,
      reason: 'ticket_cancelled',
      message: 'Vé này đã bị huỷ.',
      attendeeId,
      eventId,
      patch: null
    };
  }

  const allowMultipleCheckIn = Boolean(event?.settings?.allowMultipleCheckIn);
  if (attendee.checkIn?.isCheckedIn && !allowMultipleCheckIn) {
    const prevGate = attendee.checkIn.gate ? ` tại ${attendee.checkIn.gate}` : '';
    const prevTime = attendee.checkIn.checkInAt
      ? ` lúc ${new Date(attendee.checkIn.checkInAt).toLocaleTimeString('vi-VN')}`
      : '';
    return {
      outcome: OUTCOMES.DUPLICATE,
      reason: 'already_checked_in',
      message: `${MESSAGES[OUTCOMES.DUPLICATE]}${prevGate}${prevTime}.`,
      attendeeId,
      eventId,
      patch: null
    };
  }

  const requireGeoFence = Boolean(event?.settings?.requireGeoFence);
  if (requireGeoFence) {
    const center = event?.location?.geo;
    const radius = event?.location?.geoFenceRadiusMeters ?? 200;

    if (!geo || typeof geo.lat !== 'number' || typeof geo.lng !== 'number') {
      return {
        outcome: OUTCOMES.WRONG_GEO,
        reason: 'geo_missing',
        message: 'Không xác định được vị trí thiết bị để đối chiếu geo-fence.',
        attendeeId,
        eventId,
        patch: null
      };
    }

    if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
      return {
        outcome: OUTCOMES.WRONG_GEO,
        reason: 'event_geo_not_configured',
        message: 'Sự kiện chưa cấu hình toạ độ geo-fence, không thể xác thực vị trí.',
        attendeeId,
        eventId,
        patch: null
      };
    }

    const distance = haversineDistanceMeters(center, geo);
    if (distance > radius) {
      return {
        outcome: OUTCOMES.WRONG_GEO,
        reason: 'out_of_range',
        message: `${MESSAGES[OUTCOMES.WRONG_GEO]} (cách ${Math.round(distance)}m, cho phép tối đa ${radius}m).`,
        attendeeId,
        eventId,
        patch: null
      };
    }
  }

  return {
    outcome: OUTCOMES.SUCCESS,
    reason: 'ok',
    message: MESSAGES[OUTCOMES.SUCCESS],
    attendeeId,
    eventId,
    patch: {
      status: 'checked_in',
      'checkIn.isCheckedIn': true,
      'checkIn.checkInAt': new Date(now),
      'checkIn.method': 'qr_scan'
    }
  };
}

module.exports = {
  OUTCOMES,
  MESSAGES,
  decodeAttendeeIdFromToken,
  haversineDistanceMeters,
  evaluateCheckIn
};