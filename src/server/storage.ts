import { CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'crypto';

const envValue = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  const quote = value[0];
  return (quote === '"' || quote === "'") && value.at(-1) === quote ? value.slice(1, -1) : value;
};

const endpoint = envValue('S3_ENDPOINT');
const bucket = envValue('S3_BUCKET') || 'rattib-documents';
const accessKey = envValue('S3_ACCESS_KEY');
const secretKey = envValue('S3_SECRET_KEY');

export const storageEnabled = Boolean(endpoint && accessKey && secretKey);

const client = new S3Client({
  region: envValue('S3_REGION') || 'us-east-1',
  endpoint,
  forcePathStyle: envValue('S3_FORCE_PATH_STYLE') !== 'false',
  credentials: storageEnabled ? {
    accessKeyId: accessKey!,
    secretAccessKey: secretKey!,
  } : undefined,
});

export async function ensureStorageBucket() {
  if (!storageEnabled) throw new Error('Document storage is not configured');
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

export function createStorageKey(workspaceId: string, documentId: string) {
  return `${workspaceId}/${documentId}/${randomUUID()}`;
}

export function checksumSha256(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function putDocument(key: string, buffer: Buffer, mimeType: string, metadata: Record<string, string>) {
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ServerSideEncryption: envValue('S3_SERVER_SIDE_ENCRYPTION') === 'AES256' ? 'AES256' : undefined,
    Metadata: metadata,
  }));
}

export async function getDocument(key: string) {
  return client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deleteDocumentObject(key: string) {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
