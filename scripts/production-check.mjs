import 'dotenv/config';
import assert from 'node:assert/strict';

const baseUrl = (process.env.ACCEPTANCE_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

async function expectJson(pathname, status) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: 'manual' });
  assert.equal(response.status, status, `${pathname} returned ${response.status}`);
  return { response, body: await response.json() };
}

const health = await expectJson('/healthz', 200);
assert.equal(health.body.status, 'ok');
const readiness = await expectJson('/readyz', 200);
assert.equal(readiness.body.database, 'ok');

const anonymous = await expectJson('/api/all-data', 401);
assert.equal(anonymous.body.error, 'Authentication required');

const page = await fetch(baseUrl);
assert.equal(page.status, 200);
assert.equal(page.headers.get('x-powered-by'), null);
assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
assert.match(page.headers.get('content-security-policy') || '', /default-src 'self'/);
assert.ok(page.headers.get('x-request-id'));
if (baseUrl.startsWith('https://')) assert.match(page.headers.get('strict-transport-security') || '', /max-age=/);

if (process.env.ACCEPTANCE_EMAIL && process.env.ACCEPTANCE_PASSWORD) {
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: baseUrl },
    body: JSON.stringify({ email: process.env.ACCEPTANCE_EMAIL, password: process.env.ACCEPTANCE_PASSWORD }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie') || '';
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
}

const durations = [];
for (let index = 0; index < 10; index += 1) {
  const start = performance.now();
  const response = await fetch(`${baseUrl}/readyz`);
  assert.equal(response.status, 200);
  await response.arrayBuffer();
  durations.push(performance.now() - start);
}
durations.sort((a, b) => a - b);
const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
assert.ok(p95 < 1_000, `Readiness p95 is ${p95.toFixed(1)}ms`);
console.log(`Production acceptance passed for ${baseUrl}; readiness p95 ${p95.toFixed(1)}ms.`);
