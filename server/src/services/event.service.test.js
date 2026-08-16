const test = require('node:test');
const assert = require('node:assert/strict');

const { validateEventPayload, buildEventQuery } = require('./event.service');

test('validateEventPayload: chấp nhận event hợp lệ', () => {
  const ok = validateEventPayload({
    organizationId: '64f1c2b2b2b2b2b2b2b2b2b2',
    name: 'Tech Summit 2026',
    startAt: '2026-09-01T09:00:00.000Z',
    endAt: '2026-09-01T17:00:00.000Z',
    location: { address: 'Quận 1, TP.HCM' },
    gates: [{ name: 'Cổng A', code: 'GATE_A' }]
  });

  assert.equal(ok.valid, true);
  assert.equal(ok.data.name, 'Tech Summit 2026');
  assert.equal(ok.data.gates.length, 1);
  assert.equal(ok.data.status, 'draft');
});

test('validateEventPayload: từ chối khi startAt >= endAt', () => {
  const result = validateEventPayload({
    organizationId: '64f1c2b2b2b2b2b2b2b2b2b2',
    name: 'Event sai thời gian',
    startAt: '2026-09-01T17:00:00.000Z',
    endAt: '2026-09-01T17:00:00.000Z'
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.path.includes('endAt')));
});

test('buildEventQuery: lọc theo status và organizationId', () => {
  const query = buildEventQuery({ status: 'published', organizationId: '64f1c2b2b2b2b2b2b2b2b2b2' });

  assert.equal(query.status, 'published');
  assert.equal(String(query.organizationId), '64f1c2b2b2b2b2b2b2b2b2b2');
});
