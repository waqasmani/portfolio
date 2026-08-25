Every public endpoint is an invitation. Contact forms get hammered by spam bots, auth endpoints get credential-stuffed, and one buggy client in a retry loop can look exactly like a DDoS. Rate limiting is the seatbelt — cheap, boring, and the difference between an incident and a log line.

## The algorithm that earns its keep: token bucket

Fixed windows have an ugly edge: 100 requests at 11:59:59 and 100 more at 12:00:01 — double your limit in two seconds. The token bucket handles bursts gracefully: a bucket holds up to `capacity` tokens, refills at `rate` per second, and each request spends one. Empty bucket → 429.

A complete in-memory implementation is small enough to read in one sitting:

```ts
// lib/rate-limit.ts
type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { capacity = 10, refillPerSec = 0.5 } = {}
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: capacity, updatedAt: now };

  // Refill based on elapsed time
  const elapsed = (now - bucket.updatedAt) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerSec);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec: Math.ceil((1 - bucket.tokens) / refillPerSec) };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { ok: true, retryAfterSec: 0 };
}
```

Sweep stale buckets on an interval, or lazily on access, and memory stays bounded. `capacity` is your burst allowance; `refillPerSec` is your sustained rate. A contact form might use `{ capacity: 5, refillPerSec: 0.05 }` — five quick tries, then roughly one every 20 seconds.

## Keys: who are you limiting?

The key decides the fairness of the whole system:

- **IP address** for anonymous traffic — but read it from the *trusted* proxy header you configured (`X-Forwarded-For`'s first hop behind your own Nginx), never from user-supplied headers.
- **API key or user ID** for authenticated traffic — limits follow the account across IPs, and one office NAT doesn't starve a whole company.
- **Composite keys** for precision: `login:${ip}` *and* `login:${email}` on auth endpoints, so an attacker can't rotate IPs to brute-force one account, nor hammer many accounts from one IP.

## Answer 429s like a professional

A rate-limited response should teach clients how to behave:

```ts
if (!result.ok) {
  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: {
      'Retry-After': String(result.retryAfterSec),
      'RateLimit-Limit': '10',
      'RateLimit-Remaining': '0',
    },
  });
}
```

Well-behaved SDKs and browsers respect `Retry-After`, which converts a thundering herd of retries into a polite queue — the header is doing traffic shaping for you.

## When in-memory stops being enough

The map above lives in one process. That's correct for a single-node app (and per-node limiting still caps total abuse at `nodes × limit` — often fine). You need shared state when limits must be *exact* across a cluster, and Redis is the standard answer — one atomic Lua script per check keeps the read-modify-write race-free.

The mistake to avoid is coupling your handlers to either backend. Keep the interface stable and swap the engine by environment:

```ts
export interface RateLimiter {
  check(key: string, opts?: LimitOpts): Promise<{ ok: boolean; retryAfterSec: number }>;
}
```

Handlers depend on `RateLimiter`; whether tokens live in a `Map` or in Redis is a deployment detail.

## Layer it

Application-level limiting is the precise layer, not the only one. In front of it: Nginx `limit_req` (cheap, absorbs floods before Node sees them) and Cloudflare's edge rules (absorbs them before your network does). Each layer is coarser and cheaper than the one behind it — by the time a request reaches your token bucket, it has already earned the right to be considered.

Rate limiting will never demo well. Ship it anyway — it's the feature you only notice missing once, at 3 a.m., from your phone.
