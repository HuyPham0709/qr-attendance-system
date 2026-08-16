// server/src/services/checkin.service.test.js
//
// Chạy: node --test src/services/checkin.service.test.js
// hoặc: npm test   (xem script "test" trong package.json)
//
// Dùng node:test built-in của Node.js (>=18) — không cần cài Jest/Mocha.

const test = require('node:test');
const assert = require('node:assert/strict');

const { generateQrSecret, generateQRToken } = require('./qrEngine.service');
const { OUTCOMES, decodeAttendeeIdFromToken, haversineDistanceMeters, evaluateCheckIn } = require('./checkin.service');

// --- Helper dựng dữ liệu giả cho test, không cần Mongoose/DB thật ---

function makeAttendee(overrides = {}) {
  const qrSecret = overrides.qrSecret ?? generateQrSecret();
  const attendeeId = overrides._id ?? '64f1c2b2b2b2b2b2b2b2b2b2';
  const eventId = overrides.eventId ?? '64f1c2b2b2b2b2b2b2b2b2b3';
  const version = overrides.qrVersion ?? 1;

  return {
    _id: attendeeId,
    eventId,
    qrSecret,
    qrVersion: version,
    status: overrides.status ?? 'registered',
    checkIn: overrides.checkIn ?? { isCheckedIn: false },
    ...overrides
  };
}

function makeEvent(overrides = {}) {
  return {
    _id: overrides._id ?? '64f1c2b2b2b2b2b2b2b2b2b3',
    settings: {
      allowMultipleCheckIn: false,
      requireGeoFence: false,
      ...(overrides.settings ?? {})
    },
    location: {
      geo: { lat: 10.7769, lng: 106.7009 },
      geoFenceRadiusMeters: 200,
      ...(overrides.location ?? {})
    }
  };
}

function tokenFor(attendee, opts = {}) {
  return generateQRToken({
    attendeeId: String(attendee._id),
    eventId: String(attendee.eventId),
    qrSecret: attendee.qrSecret,
    version: opts.version ?? attendee.qrVersion,
    ttlMinutes: opts.ttlMinutes ?? 0
  });
}

// =========================================================================
// decodeAttendeeIdFromToken
// =========================================================================

test('decodeAttendeeIdFromToken: đọc đúng attendeeId/eventId từ token hợp lệ', () => {
  const attendee = makeAttendee();
  const token = tokenFor(attendee);
  const decoded = decodeAttendeeIdFromToken(token);
  assert.equal(decoded.attendeeId, String(attendee._id));
  assert.equal(decoded.eventId, String(attendee.eventId));
});

test('decodeAttendeeIdFromToken: trả null nếu token không phải base64url hợp lệ', () => {
  assert.equal(decodeAttendeeIdFromToken('##không-phải-token##'), null);
});

test('decodeAttendeeIdFromToken: trả null nếu payload thiếu phần', () => {
  const fakeToken = Buffer.from('chi-co-1-phan').toString('base64url');
  assert.equal(decodeAttendeeIdFromToken(fakeToken), null);
});

// =========================================================================
// haversineDistanceMeters
// =========================================================================

test('haversineDistanceMeters: cùng 1 điểm → khoảng cách ~0', () => {
  const p = { lat: 10.7769, lng: 106.7009 };
  assert.ok(haversineDistanceMeters(p, p) < 0.001);
});

test('haversineDistanceMeters: 2 điểm cách nhau ~1 độ vĩ độ → khoảng cách ~111km', () => {
  const a = { lat: 10, lng: 106 };
  const b = { lat: 11, lng: 106 };
  const d = haversineDistanceMeters(a, b);
  // 1 độ vĩ độ ~ 111.19km, cho sai số vài km vì công thức xấp xỉ Trái Đất hình cầu
  assert.ok(d > 110_000 && d < 112_500, `expected ~111km, got ${d}`);
});

// =========================================================================
// evaluateCheckIn — happy path
// =========================================================================

test('evaluateCheckIn: token hợp lệ, chưa check-in → SUCCESS + patch đúng', () => {
  const attendee = makeAttendee();
  const event = makeEvent();
  const token = tokenFor(attendee);

  const result = evaluateCheckIn({ token, attendee, event });

  assert.equal(result.outcome, OUTCOMES.SUCCESS);
  assert.equal(result.attendeeId, String(attendee._id));
  assert.equal(result.patch.status, 'checked_in');
  assert.equal(result.patch['checkIn.isCheckedIn'], true);
  assert.equal(result.patch['checkIn.method'], 'qr_scan');
  assert.ok(result.patch['checkIn.checkInAt'] instanceof Date);
});

// =========================================================================
// evaluateCheckIn — chữ ký / giả mạo
// =========================================================================

test('evaluateCheckIn: token bị sửa 1 ký tự → INVALID_QR (invalid_signature)', () => {
  const attendee = makeAttendee();
  const event = makeEvent();
  const token = tokenFor(attendee);

  // Sửa 1 ký tự giữa token để giả lập giả mạo
  const tampered = token.slice(0, -2) + (token.at(-2) === 'A' ? 'B' : 'A') + token.at(-1);

  const result = evaluateCheckIn({ token: tampered, attendee, event });

  assert.equal(result.outcome, OUTCOMES.INVALID_QR);
  assert.equal(result.reason, 'invalid_signature');
});

test('evaluateCheckIn: token ký bằng qrSecret của người KHÁC → INVALID_QR', () => {
  const attendee = makeAttendee();
  const event = makeEvent();
  const wrongSecretToken = generateQRToken({
    attendeeId: String(attendee._id),
    eventId: String(attendee.eventId),
    qrSecret: generateQrSecret(), // secret sai
    version: attendee.qrVersion
  });

  const result = evaluateCheckIn({ token: wrongSecretToken, attendee, event });
  assert.equal(result.outcome, OUTCOMES.INVALID_QR);
  assert.equal(result.reason, 'invalid_signature');
});

test('evaluateCheckIn: attendee không tồn tại (null) → INVALID_QR, không throw', () => {
  const result = evaluateCheckIn({ token: 'bat-ky-gi', attendee: null, event: makeEvent() });
  assert.equal(result.outcome, OUTCOMES.INVALID_QR);
  assert.equal(result.reason, 'attendee_not_found');
});

// =========================================================================
// evaluateCheckIn — hết hạn (rotating QR)
// =========================================================================

test('evaluateCheckIn: token rotating đã hết hạn → EXPIRED_QR', async () => {
  const attendee = makeAttendee();
  const event = makeEvent();
  // ttlMinutes rất nhỏ + chờ hết hạn thật để test đúng nhánh "expired"
  // (không mock Date.now vì generateQRToken tự đọc Date.now() nội bộ).
  const token = tokenFor(attendee, { ttlMinutes: 0.001 }); // ~60ms

  await new Promise((r) => setTimeout(r, 150));

  const result = evaluateCheckIn({ token, attendee, event });
  assert.equal(result.outcome, OUTCOMES.EXPIRED_QR);
});

// =========================================================================
// evaluateCheckIn — revoke (qrVersion không khớp)
// =========================================================================

test('evaluateCheckIn: token mang version cũ, attendee đã bị revoke (qrVersion tăng) → REVOKED', () => {
  const attendee = makeAttendee({ qrVersion: 2 }); // đã revoke 1 lần, giờ version=2
  const event = makeEvent();
  const oldToken = tokenFor(attendee, { version: 1 }); // token cũ mang version=1

  const result = evaluateCheckIn({ token: oldToken, attendee, event });
  assert.equal(result.outcome, OUTCOMES.REVOKED);
  assert.equal(result.reason, 'version_mismatch');
});

test('evaluateCheckIn: vé bị huỷ (status=cancelled) → REVOKED', () => {
  const attendee = makeAttendee({ status: 'cancelled' });
  const event = makeEvent();
  const token = tokenFor(attendee);

  const result = evaluateCheckIn({ token, attendee, event });
  assert.equal(result.outcome, OUTCOMES.REVOKED);
  assert.equal(result.reason, 'ticket_cancelled');
});

// =========================================================================
// evaluateCheckIn — chống trùng
// =========================================================================

test('evaluateCheckIn: đã check-in rồi, event KHÔNG cho phép check-in nhiều lần → DUPLICATE', () => {
  const attendee = makeAttendee({
    checkIn: { isCheckedIn: true, gate: 'GATE_A', checkInAt: new Date() }
  });
  const event = makeEvent({ settings: { allowMultipleCheckIn: false } });
  const token = tokenFor(attendee);

  const result = evaluateCheckIn({ token, attendee, event });
  assert.equal(result.outcome, OUTCOMES.DUPLICATE);
  assert.match(result.message, /GATE_A/);
});

test('evaluateCheckIn: đã check-in rồi nhưng event CHO PHÉP check-in nhiều lần → SUCCESS', () => {
  const attendee = makeAttendee({
    checkIn: { isCheckedIn: true, gate: 'GATE_A', checkInAt: new Date() }
  });
  const event = makeEvent({ settings: { allowMultipleCheckIn: true } });
  const token = tokenFor(attendee);

  const result = evaluateCheckIn({ token, attendee, event });
  assert.equal(result.outcome, OUTCOMES.SUCCESS);
});

// =========================================================================
// evaluateCheckIn — geo-fence
// =========================================================================

test('evaluateCheckIn: requireGeoFence=true, quét trong bán kính cho phép → SUCCESS', () => {
  const attendee = makeAttendee();
  const event = makeEvent({
    settings: { requireGeoFence: true },
    location: { geo: { lat: 10.7769, lng: 106.7009 }, geoFenceRadiusMeters: 200 }
  });
  const token = tokenFor(attendee);

  // Cách tâm ~vài mét
  const geo = { lat: 10.777, lng: 106.7009 };
  const result = evaluateCheckIn({ token, attendee, event, geo });
  assert.equal(result.outcome, OUTCOMES.SUCCESS);
});

test('evaluateCheckIn: requireGeoFence=true, quét ngoài bán kính → WRONG_GEO', () => {
  const attendee = makeAttendee();
  const event = makeEvent({
    settings: { requireGeoFence: true },
    location: { geo: { lat: 10.7769, lng: 106.7009 }, geoFenceRadiusMeters: 200 }
  });
  const token = tokenFor(attendee);

  // Cách tâm ~1.1km (0.01 độ vĩ độ) — vượt xa 200m cho phép
  const geo = { lat: 10.787, lng: 106.7009 };
  const result = evaluateCheckIn({ token, attendee, event, geo });
  assert.equal(result.outcome, OUTCOMES.WRONG_GEO);
  assert.equal(result.reason, 'out_of_range');
});

test('evaluateCheckIn: requireGeoFence=true nhưng thiết bị không gửi geo → WRONG_GEO', () => {
  const attendee = makeAttendee();
  const event = makeEvent({ settings: { requireGeoFence: true } });
  const token = tokenFor(attendee);

  const result = evaluateCheckIn({ token, attendee, event /* không có geo */ });
  assert.equal(result.outcome, OUTCOMES.WRONG_GEO);
  assert.equal(result.reason, 'geo_missing');
});

test('evaluateCheckIn: requireGeoFence=true nhưng event chưa cấu hình toạ độ → WRONG_GEO (lỗi cấu hình)', () => {
  const attendee = makeAttendee();
  const event = makeEvent({ settings: { requireGeoFence: true }, location: { geo: undefined } });
  const token = tokenFor(attendee);

  const result = evaluateCheckIn({ token, attendee, event, geo: { lat: 10.7769, lng: 106.7009 } });
  assert.equal(result.outcome, OUTCOMES.WRONG_GEO);
  assert.equal(result.reason, 'event_geo_not_configured');
});

test('evaluateCheckIn: requireGeoFence=false → không quan tâm geo, vẫn SUCCESS dù không gửi geo', () => {
  const attendee = makeAttendee();
  const event = makeEvent({ settings: { requireGeoFence: false } });
  const token = tokenFor(attendee);

  const result = evaluateCheckIn({ token, attendee, event });
  assert.equal(result.outcome, OUTCOMES.SUCCESS);
});