const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const authService = require('./auth.service');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');

function buildMockUser(overrides = {}) {
  const user = {
    _id: { toString: () => '64f1c2b2b2b2b2b2b2b2b2b1' },
    organizationId: { toString: () => '64f1c2b2b2b2b2b2b2b2b2b2' },
    name: 'Người test',
    email: 'test@example.com',
    role: 'organizer',
    isActive: true,
    assignedEvents: [],
    passwordHash: 'secret',
    ...overrides
  };

  user.select = function select() {
    return this;
  };

  return user;
}

function withPatchedModel(model, methodName, fn, callback) {
  const original = model[methodName];
  model[methodName] = fn;
  return Promise.resolve(callback()).finally(() => {
    model[methodName] = original;
  });
}

test('sanitizeUser: giữ đúng field public, bỏ passwordHash', () => {
  const user = {
    _id: { toString: () => '64f1c2b2b2b2b2b2b2b2b2b1' },
    organizationId: { toString: () => '64f1c2b2b2b2b2b2b2b2b2b2' },
    name: 'Người test',
    email: 'test@example.com',
    role: 'organizer',
    isActive: true,
    assignedEvents: ['evt1'],
    passwordHash: 'secret'
  };

  const sanitized = authService.sanitizeUser(user);
  assert.equal(sanitized.id, '64f1c2b2b2b2b2b2b2b2b2b1');
  assert.equal(sanitized.email, 'test@example.com');
  assert.equal(sanitized.role, 'organizer');
  assert.equal(sanitized.passwordHash, undefined);
});

test('login: thành công khi email/password hợp lệ', async () => {
  const passwordHash = await bcrypt.hash('123456', 10);
  const mockUser = buildMockUser({ passwordHash });

  await withPatchedModel(User, 'findOne', () => ({
    select: () => mockUser
  }), async () => {
    await withPatchedModel(RefreshToken, 'create', async () => ({}), async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: '123456',
        ip: '127.0.0.1',
        userAgent: 'node-test'
      });

      assert.ok(result.accessToken);
      assert.ok(result.refreshToken);
      assert.equal(result.user.email, 'test@example.com');
      assert.equal(result.user.role, 'organizer');
    });
  });
});

test('login: ném AuthError khi email/password sai', async () => {
  const passwordHash = await bcrypt.hash('correct-pass', 10);
  const mockUser = buildMockUser({ passwordHash });

  await withPatchedModel(User, 'findOne', () => ({
    select: () => mockUser
  }), async () => {
    await assert.rejects(
      () => authService.login({ email: 'test@example.com', password: 'wrong-pass', ip: '127.0.0.1', userAgent: 'node-test' }),
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.code, 'INVALID_CREDENTIALS');
        return true;
      }
    );
  });
});

test('logout: khóa refresh token theo hash', async () => {
  await withPatchedModel(RefreshToken, 'updateMany', async () => ({ nModified: 1 }), async () => {
    await assert.doesNotReject(() => authService.logout({ refreshToken: 'token-thu-giang' }));
  });
});
