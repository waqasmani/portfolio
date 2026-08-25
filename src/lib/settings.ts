import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { defaultSettings, type SiteSettingsData } from '@/config/site';
import { settingsSchema } from '@/lib/schemas';

/**
 * Site settings live in a singleton JSON row and merge over code defaults, so
 * a partially-written or older-shaped row degrades gracefully instead of
 * crashing pages. A short-lived module cache keeps public pages from hitting
 * the database on every request; writes invalidate it immediately.
 */

const TTL_MS = 30 * 1000;

const store = globalThis as unknown as {
  __settingsCache?: { value: SiteSettingsData; expiresAt: number };
};

function mergeWithDefaults(raw: unknown): SiteSettingsData {
  if (!raw || typeof raw !== 'object') return { ...defaultSettings };
  const candidate = { ...defaultSettings, ...(raw as Record<string, unknown>) };
  const parsed = settingsSchema.safeParse(candidate);
  if (parsed.success) return parsed.data as SiteSettingsData;
  logger.warn('Stored site settings failed validation; using defaults', {
    issues: parsed.error.issues.map((issue) => issue.path.join('.')),
  });
  return { ...defaultSettings };
}

async function loadSettings(): Promise<SiteSettingsData> {
  const cached = store.__settingsCache;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const row = await db.siteSettings.findUnique({ where: { id: 1 } });
    const value = mergeWithDefaults(row?.data);
    store.__settingsCache = { value, expiresAt: Date.now() + TTL_MS };
    return value;
  } catch (error) {
    logger.error('Failed to load site settings', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { ...defaultSettings };
  }
}

/** Current settings (per-request deduplicated, 30s module cache). */
export const getSettings = cache(loadSettings);

export async function updateSettings(data: SiteSettingsData): Promise<SiteSettingsData> {
  const validated = settingsSchema.parse(data) as SiteSettingsData;
  await db.siteSettings.upsert({
    where: { id: 1 },
    update: { data: validated },
    create: { id: 1, data: validated },
  });
  store.__settingsCache = { value: validated, expiresAt: Date.now() + TTL_MS };
  return validated;
}

export function invalidateSettingsCache(): void {
  store.__settingsCache = undefined;
}
