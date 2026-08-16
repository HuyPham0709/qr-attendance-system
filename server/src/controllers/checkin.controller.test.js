const test = require('node:test');
const assert = require('node:assert/strict');

const { scanCheckIn } = require('./checkin.controller');
const { OUTCOMES } = require('../services/checkin.service');

test('scanCheckIn: trả về invalid_qr khi token sai định dạng', async () => {
  const req = {
    body: { token: 'token-sai' },
    user: { _id: 'u1', role: 'scanner_staff' }
  };

  let statusCode;
  let payload;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    }
  };

  await scanCheckIn(req, res);

  assert.equal(statusCode, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.result, OUTCOMES.INVALID_QR);
});
