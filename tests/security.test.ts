import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, requirePermission, tokenHash, verifyPassword } from '../src/server/security';

test('passwords use salted scrypt hashes and verify safely', async () => {
  const password = 'Secure-Test-Password-2026!';
  const first = await hashPassword(password);
  const second = await hashPassword(password);

  assert.match(first, /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('Incorrect-Password-2026!', first), false);
  assert.equal(await verifyPassword(password, 'invalid'), false);
});

test('session tokens are irreversibly hashed and deterministic', () => {
  const token = 'test-session-token';
  const hashed = tokenHash(token);
  assert.equal(hashed.length, 64);
  assert.equal(hashed, tokenHash(token));
  assert.notEqual(hashed, token);
});

test('permission middleware allows authorized roles and blocks others', () => {
  const allowed = requirePermission('client.write');
  let nextCalled = false;
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };

  allowed({ auth: { userId: 'u1', workspaceId: 'w1', role: 'employee', fullName: 'Employee' } } as any, response as any, () => { nextCalled = true; });
  assert.equal(nextCalled, true);

  nextCalled = false;
  response.statusCode = 200;
  allowed({ auth: { userId: 'u2', workspaceId: 'w1', role: 'viewer', fullName: 'Viewer' } } as any, response as any, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { error: 'Insufficient permissions' });
});
