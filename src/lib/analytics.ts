import 'server-only';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getClientIp, getCountry } from '@/lib/api';

/**
 * Privacy-friendly first-party analytics.
 *
 * No cookies, no fingerprinting libraries, no PII at rest: visitors are
 * counted via a hash of (daily-rotating salt + IP + user agent) that cannot
 * be reversed and stops linking the same visitor across days.
 */

function dailySalt(): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256')
    .update(`${process.env.SESSION_SECRET ?? 'salt'}:${day}`)
    .digest('hex');
}

export function visitorHash(req: Request): string {
  const ip = getClientIp(req);
  const ua = req.headers.get('user-agent') ?? '';
  return createHash('sha256').update(`${dailySalt()}:${ip}:${ua}`).digest('hex').slice(0, 24);
}

export function parseDevice(ua: string | null): string {
  if (!ua) return 'desktop';
  if (/ipad|tablet|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return 'mobile';
  if (/android/i.test(ua)) return 'tablet';
  return 'desktop';
}

export function parseBrowser(ua: string | null): string {
  if (!ua) return 'Other';
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua)) return 'Opera';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Other';
}

function cleanReferrer(referrer: string | undefined | null, ownOrigin: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.origin === ownOrigin) return null; // internal navigation
    return url.origin + (url.pathname === '/' ? '/' : url.pathname);
  } catch {
    return null;
  }
}

export interface TrackParams {
  type: 'pageview' | 'event';
  name?: string;
  path: string;
  referrer?: string;
}

/** Record an analytics row. Fire-and-forget: analytics must never break UX. */
export async function track(req: Request, params: TrackParams): Promise<void> {
  try {
    const ua = req.headers.get('user-agent');
    const origin = new URL(req.url).origin;
    await db.analyticsEvent.create({
      data: {
        type: params.type,
        name: params.name ?? null,
        path: params.path.slice(0, 300),
        referrer: cleanReferrer(params.referrer, origin),
        country: getCountry(req),
        device: parseDevice(ua),
        browser: parseBrowser(ua),
        visitorHash: visitorHash(req),
      },
    });
  } catch (error) {
    logger.warn('Analytics write failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ---------------------------------------------------------------------------
// Dashboard aggregations
// ---------------------------------------------------------------------------

export interface AnalyticsSummary {
  totals: {
    visitors: number;
    pageviews: number;
    conversions: number;
    visitorsPrev: number;
    pageviewsPrev: number;
  };
  timeseries: Array<{ date: string; visitors: number; pageviews: number }>;
  topPages: Array<{ path: string; views: number }>;
  topReferrers: Array<{ referrer: string; visits: number }>;
  devices: Array<{ device: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  conversionBreakdown: Array<{ name: string; count: number }>;
}

export async function getAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);

  const [pageviews, prevPageviews, events] = await Promise.all([
    db.analyticsEvent.findMany({
      where: { type: 'pageview', createdAt: { gte: since } },
      select: { path: true, referrer: true, device: true, country: true, visitorHash: true, createdAt: true },
    }),
    db.analyticsEvent.findMany({
      where: { type: 'pageview', createdAt: { gte: prevSince, lt: since } },
      select: { visitorHash: true },
    }),
    db.analyticsEvent.groupBy({
      by: ['name'],
      where: { type: 'event', createdAt: { gte: since }, name: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const byDay = new Map<string, { visitors: Set<string>; pageviews: number }>();
  const pages = new Map<string, number>();
  const referrers = new Map<string, number>();
  const devices = new Map<string, number>();
  const countries = new Map<string, number>();
  const uniqueVisitors = new Set<string>();

  for (const view of pageviews) {
    const day = view.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(day) ?? { visitors: new Set<string>(), pageviews: 0 };
    bucket.visitors.add(view.visitorHash);
    bucket.pageviews += 1;
    byDay.set(day, bucket);

    uniqueVisitors.add(view.visitorHash);
    pages.set(view.path, (pages.get(view.path) ?? 0) + 1);
    if (view.referrer) referrers.set(view.referrer, (referrers.get(view.referrer) ?? 0) + 1);
    if (view.device) devices.set(view.device, (devices.get(view.device) ?? 0) + 1);
    if (view.country) countries.set(view.country, (countries.get(view.country) ?? 0) + 1);
  }

  const timeseries: AnalyticsSummary['timeseries'] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const bucket = byDay.get(day);
    timeseries.push({
      date: day,
      visitors: bucket?.visitors.size ?? 0,
      pageviews: bucket?.pageviews ?? 0,
    });
  }

  const sorted = (map: Map<string, number>, limit: number) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

  const conversionBreakdown = events
    .map((event) => ({ name: event.name ?? 'unknown', count: event._count._all }))
    .sort((a, b) => b.count - a.count);

  return {
    totals: {
      visitors: uniqueVisitors.size,
      pageviews: pageviews.length,
      conversions: conversionBreakdown.reduce((sum, c) => sum + c.count, 0),
      visitorsPrev: new Set(prevPageviews.map((view) => view.visitorHash)).size,
      pageviewsPrev: prevPageviews.length,
    },
    timeseries,
    topPages: sorted(pages, 8).map(([path, views]) => ({ path, views })),
    topReferrers: sorted(referrers, 8).map(([referrer, visits]) => ({ referrer, visits })),
    devices: sorted(devices, 4).map(([device, count]) => ({ device, count })),
    countries: sorted(countries, 8).map(([country, count]) => ({ country, count })),
    conversionBreakdown,
  };
}
