// server/src/services/checkin.service.js
//
// GIAI ĐOẠN HIỆN TẠI: chỉ code LOGIC QUYẾT ĐỊNH (business rule), chưa nối
// API/DB/Redis. Lý do tách riêng: hàm evaluateCheckIn() dưới đây là HÀM
// THUẦN (pure function) — nhận vào attendee/event đã được load sẵn (object
// thường, không cần Mongoose document thật), KHÔNG tự query DB, KHÔNG tự
// ghi DB, KHÔNG gọi Redis. Nhờ vậy unit test chạy được ngay, không cần
// MongoDB/Redis, không cần mock phức tạp — test 1 file logic thuần.
//
// Việc nối thật (Sprint 3) sẽ là 1 lớp orchestrator riêng
// (vd checkin.controller.js) làm nhiệm vụ:
//   1. decode token thô lấy attendeeId → fetch attendee (+qrSecret) từ DB
//   2. fetch event từ DB
//   3. Redis lock theo attendeeId (chống 2 request cùng lúc)
//   4. gọi evaluateCheckIn() ở file này để LẤY QUYẾT ĐỊNH
//   5. nếu outcome === 'success': áp dụng `patch` trả về bằng
//      findOneAndUpdate CÓ ĐIỀU KIỆN (optimistic lock qua field `version`)
//      để tầng DB tự chặn lần nữa nếu Redis lock lỡ có kẽ hở
//   6. ghi CheckInLog, emit Socket.io, release Redis lock
// Lớp đó CHƯA làm ở bước này theo đúng yêu cầu.

const { verifyQRToken } = require('./qrEngine.service');

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
 * Decode "thô" (không xác thực chữ ký) để lấy attendeeId từ token —
 * dùng ở tầng orchestrator (chưa viết) để biết cần fetch attendee nào từ
 * DB TRƯỚC KHI có đủ dữ liệu (qrSecret) để verify đầy đủ.
 *
 * QUAN TRỌNG: hàm này KHÔNG xác thực chữ ký, KHÔNG được tin tưởng để ra
 * quyết định check-in — chỉ dùng để định tuyến (routing) sang bước fetch
 * + verify đầy đủ trong evaluateCheckIn().
 *
 * @returns {{attendeeId: string, eventId: string} | null} null nếu token malformed
 */
function decodeAttendeeIdFromToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split('.');
    if (parts.length !== 5) return null;
    const [attendeeId, eventId] = parts;
    if (!attendeeId || !eventId) return null;
    return { attendeeId, eventId };
  } catch {
    return null;
  }
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
 * HÀM QUYẾT ĐỊNH CHÍNH — thuần (pure), không side-effect.
 *
 * @param {Object} params
 * @param {string} params.token - token quét được từ QR
 * @param {Object} params.attendee - attendee đã load từ DB, PHẢI có field qrSecret
 * @param {Object} params.event - event tương ứng, đã load từ DB
 * @param {{lat:number, lng:number}} [params.geo] - toạ độ nơi quét (từ thiết bị scanner)
 * @param {number} [params.now] - timestamp hiện tại (ms), truyền vào để test dễ, mặc định Date.now()
 *
 * @returns {{
 *   outcome: string,       // 1 trong OUTCOMES
 *   reason: string,        // chi tiết kỹ thuật hơn (vd 'malformed', 'invalid_signature')
 *   message: string,       // thông báo tiếng Việt, hiển thị được cho scanner_staff
 *   attendeeId: string|null,
 *   eventId: string|null,
 *   patch: Object|null     // nếu outcome === success: các field cần update vào Attendee document
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

  // --- Bước 1: xác thực chữ ký + hạn dùng ---
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

  // --- Bước 2: token phải thuộc đúng event đang check-in (phòng thủ thêm,
  // dù về mặt toán học chữ ký đã đảm bảo payload không bị sửa) ---
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

  // --- Bước 3: version trong token phải khớp qrVersion hiện tại → chặn
  // QR đã bị revoke (xem revokeAttendeeQr trong qr.controller.js) ---
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

  // --- Bước 4: vé bị huỷ → coi như revoked (CheckInLog không có enum
  // riêng cho 'cancelled', dùng chung nhóm revoked) ---
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

  // --- Bước 5: chống check-in trùng ---
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

  // --- Bước 6: geo-fence (chỉ áp dụng nếu event bật requireGeoFence) ---
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
      // Event bật requireGeoFence nhưng chưa cấu hình toạ độ trung tâm —
      // đây là lỗi cấu hình phía tổ chức, không phải lỗi của attendee.
      // Chặn lại thay vì mặc định cho qua, vì "không xác thực được" khác
      // với "trong phạm vi".
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

  // --- Tất cả điều kiện đều pass → thành công ---
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
      // gate/deviceInfo/checkInBy do tầng orchestrator (Sprint 3) điền vào
      // patch này trước khi ghi DB, vì evaluateCheckIn() không nhận userId
      // (ai đang thao tác) — cố tình không đưa userId vào hàm thuần này
      // để không lẫn lộn "ai quét" (auth concern) với "có được phép
      // check-in hay không" (business rule) trong cùng 1 hàm.
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