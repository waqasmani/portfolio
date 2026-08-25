import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { Role, User } from '@/generated/prisma/client';

export const SESSION_COOKIE = 'portfolio_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RENEW_THRESHOLD_MS = SESSION_TTL_MS / 2; // sliding renewal

export type SessionUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// ---------------------------------------------------------------------------
// Login / logout
// ---------------------------------------------------------------------------

export async function verifyCredentials(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always run a compare so response timing doesn't reveal whether the
  // account exists.
  const hash = user?.passwordHash ?? '$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZBpEwmyrz1Kd7z1e2xF3lQxWukXaGm';
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    },
  });
  return { token, expiresAt };
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  };
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

// ---------------------------------------------------------------------------
// Session resolution (per-request cached)
// ---------------------------------------------------------------------------

async function resolveSession(token: string): Promise<SessionUser | null> {
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Sliding expiry: quietly extend active sessions past the halfway mark.
  if (session.expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    await db.session
      .update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
      })
      .catch(() => {});
  }

  return session.user;
}

/** Current admin user, or null. Deduplicated per request via React cache. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await resolveSession(token);
  } catch (error) {
    logger.error('Session resolution failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
});

/** Guard for admin server components/pages: redirects to login when absent. */
export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/admin/login');
  if (role && !hasRole(user, role)) redirect('/admin');
  return user;
}

/** Guard for API route handlers: returns null when unauthorized. */
export async function getApiUser(role?: Role): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (role && !hasRole(user, role)) return null;
  return user;
}

/** ADMIN satisfies every role requirement; EDITOR satisfies EDITOR. */
export function hasRole(user: SessionUser, role: Role): boolean {
  if (user.role === 'ADMIN') return true;
  return user.role === role;
}

/** Constant-time string comparison for tokens/secrets. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Remove expired sessions — called opportunistically from login. */
export async function pruneExpiredSessions(): Promise<void> {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
}
