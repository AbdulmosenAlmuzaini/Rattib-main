import 'dotenv/config';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error('DATABASE_URL is required');

const parsedUrl = new URL(sourceUrl);
parsedUrl.searchParams.set('schema', 'rattib_test');
const testDatabaseUrl = parsedUrl.toString();
const port = process.env.TEST_PORT || String(32_000 + Math.floor(Math.random() * 1_000));
const baseUrl = `http://127.0.0.1:${port}`;
const testPassword = 'Rattib-Test-Password-2026!';
const prismaCli = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)));
  });
}

async function waitUntilReady() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/readyz`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Test server did not become ready within 60 seconds');
}

const testEnv = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: port,
  DATABASE_URL: testDatabaseUrl,
  TEST_BASE_URL: baseUrl,
  TEST_DATABASE_URL: testDatabaseUrl,
  SEED_ADMIN_PASSWORD: testPassword,
  TEST_OWNER_PASSWORD: testPassword,
  S3_ENDPOINT: '',
  S3_ACCESS_KEY: '',
  S3_SECRET_KEY: '',
};

let server;
try {
  await run(process.execPath, [prismaCli, 'migrate', 'reset', '--force', '--skip-seed'], { env: testEnv });
  server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], { cwd: projectRoot, env: testEnv, stdio: 'inherit' });
  await waitUntilReady();
  await run(process.execPath, ['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/api.integration.test.ts'], { env: testEnv });
} finally {
  if (server && !server.killed) {
    const stopped = new Promise(resolve => server.once('exit', resolve));
    server.kill('SIGTERM');
    await Promise.race([stopped, new Promise(resolve => setTimeout(resolve, 5_000))]);
  }
}
