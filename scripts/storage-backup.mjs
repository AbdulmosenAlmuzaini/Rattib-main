import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const mode = process.argv[2];
const targetDirectory = process.argv[3] ? path.resolve(process.argv[3]) : null;
const verifyOnly = process.argv.includes('--verify-only');
if (!['backup', 'restore'].includes(mode) || !targetDirectory) {
  throw new Error('Usage: node scripts/storage-backup.mjs <backup|restore> <directory> [--verify-only]');
}

const bucket = process.env.S3_BUCKET || 'rattib-documents';
const enabled = Boolean(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
const manifestPath = path.join(targetDirectory, 'storage-manifest.json');
const objectRoot = path.join(targetDirectory, 'objects');

const client = enabled ? new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY },
}) : null;

function checksum(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function safeObjectPath(key) {
  const normalized = path.normalize(key.replaceAll('\\', '/'));
  const resolved = path.resolve(objectRoot, normalized);
  if (resolved !== objectRoot && !resolved.startsWith(`${objectRoot}${path.sep}`)) throw new Error(`Unsafe object key: ${key}`);
  return resolved;
}

async function backup() {
  await mkdir(objectRoot, { recursive: true });
  if (!client) {
    await writeFile(manifestPath, JSON.stringify({ version: 1, bucket, storageConfigured: false, objects: [] }, null, 2));
    return;
  }

  const objects = [];
  let continuationToken;
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken }));
    for (const item of page.Contents || []) {
      if (!item.Key) continue;
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: item.Key }));
      const bytes = Buffer.from(await response.Body.transformToByteArray());
      const filePath = safeObjectPath(item.Key);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, bytes);
      objects.push({ key: item.Key, size: bytes.length, sha256: checksum(bytes), contentType: response.ContentType || 'application/octet-stream', metadata: response.Metadata || {} });
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  await writeFile(manifestPath, JSON.stringify({ version: 1, bucket, storageConfigured: true, createdAt: new Date().toISOString(), objects }, null, 2));
}

async function restore() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  for (const item of manifest.objects || []) {
    const bytes = await readFile(safeObjectPath(item.key));
    if (bytes.length !== item.size || checksum(bytes) !== item.sha256) throw new Error(`Storage backup integrity failure: ${item.key}`);
    if (!verifyOnly) {
      if (!client) throw new Error('S3 storage configuration is required to restore objects');
      await client.send(new PutObjectCommand({ Bucket: manifest.bucket || bucket, Key: item.key, Body: bytes, ContentType: item.contentType, Metadata: item.metadata }));
    }
  }
}

if (mode === 'backup') await backup();
else await restore();
