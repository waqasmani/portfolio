import Link from 'next/link';
import {
  ArrowUpRight,
  Eye,
  FileText,
  Inbox,
  Mail,
  MessageSquare,
  Users,
} from 'lucide-react';
import { db } from '@/lib/db';
import { getAnalyticsSummary } from '@/lib/analytics';
import { publishedPostWhere } from '@/lib/content';
import { timeAgo } from '@/lib/utils';
import { AdminPageTitle, AdminPanel, StatCard } from '@/components/admin/ui';
import { AreaChart } from '@/components/admin/charts';
import { StatusBadge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

function delta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export default async function AdminOverviewPage() {
  const [summary, newRequests, openChats, newMessages, blogViews, recentRequests, recentMessages] =
    await Promise.all([
      getAnalyticsSummary(30),
      db.projectRequest.count({ where: { status: 'NEW' } }),
      db.chatConversation.count({ where: { status: { not: 'CLOSED' } } }),
      db.contactMessage.count({ where: { status: 'NEW' } }),
      db.blogPost.aggregate({ _sum: { views: true }, where: publishedPostWhere() }),
      db.projectRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      db.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

  return (
    <>
      <AdminPageTitle title="Overview" description="The last 30 days at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Unique visitors"
          value={summary.totals.visitors}
          icon={Users}
          delta={delta(summary.totals.visitors, summary.totals.visitorsPrev)}
          hint="vs previous 30d"
        />
        <StatCard
          label="Page views"
          value={summary.totals.pageviews}
          icon={Eye}
          delta={delta(summary.totals.pageviews, summary.totals.pageviewsPrev)}
          hint="vs previous 30d"
        />
        <StatCard label="New project requests" value={newRequests} icon={Inbox} hint="awaiting review" />
        <StatCard label="Open chats" value={openChats} icon={MessageSquare} hint="active conversations" />
        <StatCard label="New messages" value={newMessages} icon={Mail} hint="contact inbox" />
        <StatCard label="Blog reads" value={blogViews._sum.views ?? 0} icon={FileText} hint="all time" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <AdminPanel title="Traffic — last 30 days" className="xl:col-span-2">
          <AreaChart
            points={summary.timeseries.map((point) => ({
              date: point.date,
              value: point.pageviews,
              secondary: point.visitors,
            }))}
          />
        </AdminPanel>

        <AdminPanel title="Conversions — last 30 days">
          <ul className="space-y-3">
            {summary.conversionBreakdown.map((conversion) => (
              <li key={conversion.name} className="flex items-center justify-between gap-3 text-[0.85rem]">
                <span className="text-muted capitalize">{conversion.name.replace(/_/g, ' ')}</span>
                <span className="font-mono font-semibold text-ink tabular-nums">{conversion.count}</span>
              </li>
            ))}
            {summary.conversionBreakdown.length === 0 && (
              <li className="py-6 text-center text-sm text-faint">No conversion events yet</li>
            )}
          </ul>
        </AdminPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminPanel
          title="Latest project requests"
          padded={false}
          actions={
            <Link href="/admin/requests" className="flex items-center gap-1 text-[0.78rem] font-medium text-accent">
              All requests <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {recentRequests.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/admin/requests/${request.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-panel"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.88rem] font-medium text-ink">{request.title}</p>
                    <p className="truncate text-[0.75rem] text-faint">
                      {request.name} · {request.category} · {request.budget}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                  <span className="w-16 text-right font-mono text-[0.68rem] text-faint">
                    {timeAgo(request.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
            {recentRequests.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-faint">No project requests yet</li>
            )}
          </ul>
        </AdminPanel>

        <AdminPanel
          title="Latest contact messages"
          padded={false}
          actions={
            <Link href="/admin/messages" className="flex items-center gap-1 text-[0.78rem] font-medium text-accent">
              All messages <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {recentMessages.map((message) => (
              <li key={message.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.88rem] font-medium text-ink">{message.subject}</p>
                  <p className="truncate text-[0.75rem] text-faint">
                    {message.name} · {message.email}
                  </p>
                </div>
                <StatusBadge status={message.status} />
                <span className="w-16 text-right font-mono text-[0.68rem] text-faint">
                  {timeAgo(message.createdAt)}
                </span>
              </li>
            ))}
            {recentMessages.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-faint">No messages yet</li>
            )}
          </ul>
        </AdminPanel>
      </div>
    </>
  );
}
