/**
 * Token-bucket rate limiter.
 *
 * In-memory implementation — correct for a single long-lived Node process
 * (PM2 fork of 1, Docker, `next start`). For multi-instance deployments swap
 * the store for Redis behind the same interface; handlers don't change.
 */

export interface LimitOptions {
  /** Maximum burst size. */
  capacity: number;
  /** Sustained refill rate, tokens per second. */
  refillPerSec: number;
}

export interface LimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const globalStore = globalThis as unknown as { __rateBuckets?: Map<string, Bucket> };
const buckets = (globalStore.__rateBuckets ??= new Map());

const MAX_BUCKETS = 50_000;

function sweep() {
  // Drop buckets idle for over an hour; called lazily to stay dependency-free.
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [key, bucket] of buckets) {
    if (bucket.updatedAt < cutoff) buckets.delete(key);
  }
}

export function rateLimit(key: string, options: LimitOptions): LimitResult {
  const { capacity, refillPerSec } = options;
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) sweep();

  const bucket = buckets.get(key) ?? { tokens: capacity, updatedAt: now };
  const elapsed = (now - bucket.updatedAt) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerSec);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((1 - bucket.tokens) / refillPerSec)),
    };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterSec: 0 };
}

/** Common presets so limits stay consistent across the API surface. */
export const limits = {
  /** Contact / request forms: 5 quick tries, then ~1 per 30s. */
  form: { capacity: 5, refillPerSec: 1 / 30 },
  /** Login: 5 attempts, then ~1 per minute per key. */
  login: { capacity: 5, refillPerSec: 1 / 60 },
  /** Chat messages: bursty but bounded. */
  chat: { capacity: 12, refillPerSec: 0.5 },
  /** AI assistant: costs real money — keep it tight. */
  assistant: { capacity: 4, refillPerSec: 1 / 45 },
  /** Analytics beacon: cheap but floodable. */
  beacon: { capacity: 30, refillPerSec: 1 },
  /** General admin mutation endpoints. */
  admin: { capacity: 60, refillPerSec: 2 },
} satisfies Record<string, LimitOptions>;
