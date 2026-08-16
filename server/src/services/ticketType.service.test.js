const test = require('node:test');
const assert = require('node:assert/strict');

const { validateTicketTypePayload, buildTicketTypeQuery } = require('./ticketType.service');

test('validateTicketTypePayload: chấp nhận dữ liệu loại vé hợp lệ', () => {
  const result = validateTicketTypePayload({
    eventId: '64f1c2b2b2b2b2b2b2b2b2b1',
    name: 'Standard',
    quantityLimit: 100,
    price: 0,
    allowedSessions: []
  });

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.data.name, 'Standard');
  assert.equal(result.data.price, 0);
});

test('validateTicketTypePayload: từ chối khi eventId thiếu', () => {
  const result = validateTicketTypePayload({
    name: 'VIP',
    price: 500000
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.path.includes('eventId')));
});

test('validateTicketTypePayload: từ chối khi name trống', () => {
  const result = validateTicketTypePayload({
    eventId: '64f1c2b2b2b2b2b2b2b2b2b1',
    name: '',
    price: 0
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.path.includes('name')));
});

test('buildTicketTypeQuery: lọc theo eventId', () => {
  const query = buildTicketTypeQuery({
    eventId: '64f1c2b2b2b2b2b2b2b2b2b1'
  });

  assert.deepEqual(query, { eventId: '64f1c2b2b2b2b2b2b2b2b2b1' });
});

test('buildTicketTypeQuery: lọc theo search (name)', () => {
  const query = buildTicketTypeQuery({
    eventId: '64f1c2b2b2b2b2b2b2b2b2b1',
    search: 'VIP'
  });

  assert.ok(query.name);
  assert.ok(query.name.$regex);
  assert.equal(query.name.$options, 'i');
});
