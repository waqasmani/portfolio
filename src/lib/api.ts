import { logger } from '@/lib/logger';
import { rateLimit, type LimitOptions } from '@/lib/rate-limit';

/** Standard JSON error body used across the API surface. */
export function jsonError(
  status: number,
  message: string,
  extra?: { errors?: Record<string, string[] | undefined>; retryAfterSec?: number }
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (extra?.retryAfterSec) headers['Retry-After'] = String(extra.retryAfterSec);
  return new Response(
    JSON.stringify({ ok: false, message, ...(extra?.errors ? { errors: extra.errors } : {}) }),
    { status, headers }
  );
}

export function jsonOk<T extends Record<string, unknown>>(data?: T, init?: ResponseInit) {
  return Response.json({ ok: true, ...(data ?? {}) }, init);
}

/**
 * Client IP for rate limiting. Behind our own Nginx/Cloudflare the first
 * X-Forwarded-For hop is trustworthy; locally it falls back to a constant.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

/** Country hint from edge headers (Cloudflare / Vercel), if present. */
export function getCountry(req: Request): string | null {
  return req.headers.get('cf-ipcountry') ?? req.headers.get('x-vercel-ip-country');
}

/** Apply a rate limit; returns a ready-made 429 response when exceeded. */
export function enforceLimit(req: Request, scope: string, options: LimitOptions): Response | null {
  const result = rateLimit(`${scope}:${getClientIp(req)}`, options);
  if (result.ok) return null;
  return jsonError(429, 'Too many requests — please slow down.', {
    retryAfterSec: result.retryAfterSec,
  });
}

/** Parse a JSON body without letting malformed input throw. */
export async function readJson(req: Request): Promise<unknown> {
  return req.json().catch(() => null);
}

/** Wrap a route handler with uniform error handling + logging. */
export function withErrorHandling<Args extends unknown[]>(
  name: string,
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      logger.error(`Unhandled error in ${name}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return jsonError(500, 'Something went wrong on our side. Please try again.');
    }
  };
}
