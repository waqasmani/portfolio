import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AwsClient } from 'aws4fetch';
import { logger } from '@/lib/logger';

/**
 * File storage with two drivers behind one interface:
 *
 * - S3-compatible (Cloudflare R2) when S3_* env vars are set — objects go to
 *   the bucket via SigV4-signed requests (aws4fetch, no heavyweight SDK).
 * - Local disk fallback (./.uploads, git-ignored) so uploads work with zero
 *   configuration in development and on single-server deployments.
 *
 * Keys are server-generated (uuid + sanitized name) — user input never forms
 * a filesystem path on its own.
 */

const LOCAL_DIR = path.join(process.cwd(), '.uploads');

function s3Configured(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );
}

function s3Client(): AwsClient {
  return new AwsClient({
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    service: 's3',
    region: 'auto',
  });
}

function objectUrl(key: string): string {
  const endpoint = process.env.S3_ENDPOINT!.replace(/\/$/, '');
  return `${endpoint}/${process.env.S3_BUCKET}/${key}`;
}

export function makeStorageKey(filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const date = new Date().toISOString().slice(0, 10);
  return `uploads/${date}/${randomUUID()}-${safeName}`;
}

export async function putObject(key: string, data: Buffer, contentType: string): Promise<void> {
  if (s3Configured()) {
    const response = await s3Client().fetch(objectUrl(key), {
      method: 'PUT',
      headers: { 'Content-Type': contentType, 'Content-Length': String(data.byteLength) },
      body: new Uint8Array(data),
    });
    if (!response.ok) {
      throw new Error(`S3 upload failed with status ${response.status}`);
    }
    return;
  }

  const filePath = localPath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
}

export async function getObject(key: string): Promise<Buffer | null> {
  if (s3Configured()) {
    const response = await s3Client().fetch(objectUrl(key));
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  }

  try {
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}

function localPath(key: string): string {
  // Hash-based layout prevents any traversal via crafted keys.
  const digest = createHash('sha256').update(key).digest('hex');
  const ext = path.extname(key).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10);
  return path.join(LOCAL_DIR, digest.slice(0, 2), `${digest}${ext}`);
}

export function storageDriver(): 'r2' | 'local' {
  return s3Configured() ? 'r2' : 'local';
}

export const uploadLimits = {
  maxFiles: 3,
  maxBytes: 5 * 1024 * 1024,
  allowedTypes: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'text/markdown',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
  ],
} as const;

export function isAllowedUploadType(type: string): boolean {
  return (uploadLimits.allowedTypes as readonly string[]).includes(type);
}

export function logStorageDriverOnce(): void {
  const store = globalThis as unknown as { __storageLogged?: boolean };
  if (store.__storageLogged) return;
  store.__storageLogged = true;
  logger.info(`File storage driver: ${storageDriver()}`);
}
