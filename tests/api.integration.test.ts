import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/server/security';

const baseUrl = process.env.TEST_BASE_URL!;
const ownerPassword = process.env.TEST_OWNER_PASSWORD!;
const prisma = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
const otherWorkspaceId = 'ws-integration-other';
const otherClientId = 'client-integration-other';
const viewerEmail = 'viewer.integration@rattib.test';
const viewerPassword = 'Viewer-Test-Password-2026!';
let ownerCookie = '';
let viewerCookie = '';

async function login(email: string, password: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: baseUrl },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  const setCookie = response.headers.get('set-cookie') || '';
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  return setCookie.split(';', 1)[0];
}

async function api(pathname: string, init: RequestInit = {}, cookie = ownerCookie) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set('cookie', cookie);
  if (init.method && !['GET', 'HEAD'].includes(init.method)) headers.set('origin', baseUrl);
  return fetch(`${baseUrl}${pathname}`, { ...init, headers });
}

before(async () => {
  const passwordHash = await hashPassword(viewerPassword);
  await prisma.workspace.create({ data: { id: otherWorkspaceId, name: 'Isolated Test Workspace', slug: 'isolated-test-workspace', brandingColor: '#1597B8' } });
  await prisma.user.create({ data: { id: 'user-integration-viewer', workspaceId: otherWorkspaceId, email: viewerEmail, fullName: 'Integration Viewer', passwordHash, role: 'viewer' } });
  await prisma.client.create({ data: { id: otherClientId, workspaceId: otherWorkspaceId, fullName: 'Isolated Client', clientType: 'individual', phone: '0500000000', nationalId: '1099999999' } });
  ownerCookie = await login('owner@rattib.com', ownerPassword);
  viewerCookie = await login(viewerEmail, viewerPassword);
});

after(async () => {
  await prisma.$disconnect();
});

test('health and readiness endpoints report a usable service', async () => {
  const health = await fetch(`${baseUrl}/healthz`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });

  const readiness = await fetch(`${baseUrl}/readyz`);
  assert.equal(readiness.status, 200);
  assert.equal((await readiness.json()).database, 'ok');
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
});

test('protected APIs reject anonymous and cross-site mutation requests', async () => {
  assert.equal((await fetch(`${baseUrl}/api/all-data`)).status, 401);
  const rejected = await fetch(`${baseUrl}/api/clients`, {
    method: 'POST',
    headers: { cookie: ownerCookie, 'content-type': 'application/json', origin: 'https://attacker.invalid' },
    body: JSON.stringify({ id: 'blocked', fullName: 'Blocked Client', phone: '0500000001' }),
  });
  assert.equal(rejected.status, 403);
});

test('tenant data is isolated and sensitive identifiers stay masked', async () => {
  const ownerData = await (await api('/api/all-data')).json();
  assert.equal(ownerData.clients.some((client: any) => client.id === otherClientId), false);
  assert.equal(ownerData.clients.some((client: any) => client.nationalId && !client.nationalId.startsWith('*')), false);

  const viewerData = await (await api('/api/all-data', {}, viewerCookie)).json();
  assert.deepEqual(viewerData.workspaces.map((workspace: any) => workspace.id), [otherWorkspaceId]);
  assert.deepEqual(viewerData.clients.map((client: any) => client.id), [otherClientId]);

  const crossTenantRead = await api(`/api/clients/${otherClientId}/sensitive?field=nationalId`);
  assert.equal(crossTenantRead.status, 404);
});

test('RBAC and request validation block forbidden or malformed writes', async () => {
  const viewerWrite = await api('/api/clients', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 'viewer-write', fullName: 'Viewer Write', phone: '0500000002' }),
  }, viewerCookie);
  assert.equal(viewerWrite.status, 403);

  const invalidWrite = await api('/api/clients', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: '', fullName: '', phone: '1' }),
  });
  assert.equal(invalidWrite.status, 400);
});

test('dashboard data endpoint meets the local performance baseline', async () => {
  await api('/api/all-data');
  const durations: number[] = [];
  for (let index = 0; index < 20; index += 1) {
    const started = performance.now();
    const response = await api('/api/all-data');
    assert.equal(response.status, 200);
    await response.arrayBuffer();
    durations.push(performance.now() - started);
  }
  durations.sort((a, b) => a - b);
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
  assert.ok(p95 < 1_000, `Expected p95 below 1000ms, received ${p95.toFixed(1)}ms`);
});
