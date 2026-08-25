import { z } from 'zod';
import { cookies } from 'next/headers';
import {
  createSession,
  pruneExpiredSessions,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyCredentials,
} from '@/lib/auth';
import { enforceLimit, getClientIp, jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { limits, rateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling('auth/login', async (req: Request) => {
  // Composite limiting: per-IP and per-account, so neither rotating IPs nor
  // hammering one mailbox works.
  const limitedByIp = enforceLimit(req, 'login-ip', limits.login);
  if (limitedByIp) return limitedByIp;

  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Check your email and password.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const email = parsed.data.email.toLowerCase();
  const byAccount = rateLimit(`login-email:${email}`, limits.login);
  if (!byAccount.ok) {
    return jsonError(429, 'Too many attempts for this account. Try again shortly.', {
      retryAfterSec: byAccount.retryAfterSec,
    });
  }

  const user = await verifyCredentials(email, parsed.data.password);
  if (!user) {
    logger.warn('Failed login attempt', { ip: getClientIp(req) });
    return jsonError(401, 'Invalid email or password.');
  }

  const { token, expiresAt } = await createSession(user.id, {
    ip: getClientIp(req),
    userAgent: req.headers.get('user-agent'),
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

  void pruneExpiredSessions();
  logger.info('Admin login', { userId: user.id });

  return jsonOk({ user: { name: user.name, email: user.email, role: user.role } });
});
