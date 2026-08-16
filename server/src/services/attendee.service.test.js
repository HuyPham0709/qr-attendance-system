const test = require('node:test');
const assert = require('node:assert/strict');

const { validateAttendeeRegistration, buildAttendeeQuery } = require('./attendee.service');

test('validateAttendeeRegistration: chấp nhận dữ liệu đăng ký hợp lệ', () => {
  const result = validateAttendeeRegistration({
    eventId: '64f1c2b2b2b2b2b2b2b2b2b3',
    ticketTypeId: '64f1c2b2b2b2b2b2b2b2b2b4',
    fullName: 'Nguyễn Văn A',
    email: 'a@example.com',
    phone: '0909123456'
  });

  assert.equal(result.valid, true);
  assert.equal(result.data.fullName, 'Nguyễn Văn A');
  assert.equal(result.data.email, 'a@example.com');
});

test('validateAttendeeRegistration: từ chối email sai format', () => {
  const result = validateAttendeeRegistration({
    eventId: '64f1c2b2b2b2b2b2b2b2b2b3',
    fullName: 'Nguyễn Văn A',
    email: 'sai-email'
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.path.includes('email')));
});

test('buildAttendeeQuery: lọc theo eventId và status', () => {
  const query = buildAttendeeQuery({ eventId: '64f1c2b2b2b2b2b2b2b2b2b3', status: 'registered' });

  assert.equal(String(query.eventId), '64f1c2b2b2b2b2b2b2b2b2b3');
  assert.equal(query.status, 'registered');
});
