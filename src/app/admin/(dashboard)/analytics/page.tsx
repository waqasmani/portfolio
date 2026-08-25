import { Eye, Flag, MousePointerClick, Users } from 'lucide-react';
import { getAnalyticsSummary } from '@/lib/analytics';
import { AdminPageTitle, AdminPanel, StatCard } from '@/components/admin/ui';
import { AreaChart, BarList, Donut } from '@/components/admin/charts';

export const dynamic = 'force-dynamic';

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

function countryLabel(code: string): string {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = [7, 30, 90].includes(Number(params.days)) ? Number(params.days) : 30;
  const summary = await getAnalyticsSummary(days);

  return (
    <>
      <AdminPageTitle
        title="Analytics"
        description="Privacy-friendly first-party analytics — no cookies, no third parties, visitors hashed with a daily-rotating salt."
        actions={
          <nav className="flex rounded-full border border-line bg-panel p-1" aria-label="Range">
            {[7, 30, 90].map((option) => (
              <a
                key={option}
                href={`/admin/analytics?days=${option}`}
                aria-current={days === option ? 'page' : undefined}
                className={
                  days === option
                    ? 'rounded-full bg-panel-strong px-3.5 py-1 text-[0.78rem] font-medium text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                    : 'rounded-full px-3.5 py-1 text-[0.78rem] font-medium text-muted hover:text-ink'
                }
              >
                {option}d
              </a>
            ))}
          </nav>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Unique visitors" value={summary.totals.visitors} icon={Users} hint={`last ${days} days`} />
        <StatCard label="Page views" value={summary.totals.pageviews} icon={Eye} hint={`last ${days} days`} />
        <StatCard label="Conversions" value={summary.totals.conversions} icon={MousePointerClick} hint="tracked events" />
      </div>

      <div className="mt-6">
        <AdminPanel title={`Traffic — last ${days} days`}>
          <AreaChart
            points={summary.timeseries.map((point) => ({
              date: point.date,
              value: point.pageviews,
              secondary: point.visitors,
            }))}
          />
        </AdminPanel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminPanel title="Top pages">
          <BarList items={summary.topPages.map((page) => ({ label: page.path, value: page.views }))} />
        </AdminPanel>
        <AdminPanel title="Traffic sources">
          <BarList
            items={summary.topReferrers.map((referrer) => ({
              label: referrer.referrer.replace(/^https?:\/\/(www\.)?/, ''),
              value: referrer.visits,
            }))}
          />
          <p className="mt-3 text-[0.72rem] text-faint">Direct visits and internal navigation are not listed.</p>
        </AdminPanel>
        <AdminPanel title="Devices">
          <Donut items={summary.devices.map((device) => ({ label: device.device, value: device.count }))} />
        </AdminPanel>
        <AdminPanel title="Countries">
          <BarList
            items={summary.countries.map((country) => ({
              label: countryLabel(country.country),
              value: country.count,
            }))}
          />
          {summary.countries.length === 0 && (
            <p className="mt-2 flex items-center gap-2 text-[0.75rem] text-faint">
              <Flag className="size-3.5" aria-hidden />
              Country data appears when running behind Cloudflare (CF-IPCountry header).
            </p>
          )}
        </AdminPanel>
      </div>

      <div className="mt-6">
        <AdminPanel title="Conversion events">
          <BarList
            items={summary.conversionBreakdown.map((conversion) => ({
              label: conversion.name.replace(/_/g, ' '),
              value: conversion.count,
            }))}
          />
        </AdminPanel>
      </div>
    </>
  );
}
