import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { cn, timeAgo } from '@/lib/utils';
import { AdminPageTitle, AdminPanel } from '@/components/admin/ui';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { Prisma } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

const pipeline = ['ALL', 'NEW', 'REVIEWING', 'CONTACTED', 'PROPOSAL_SENT', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'] as const;

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser('ADMIN');
  const params = await searchParams;
  const status = pipeline.includes(params.status as (typeof pipeline)[number])
    ? (params.status as (typeof pipeline)[number])
    : 'ALL';

  const where: Prisma.ProjectRequestWhereInput =
    status === 'ALL' ? {} : { status: status as Exclude<typeof status, 'ALL'> };

  const [requests, counts] = await Promise.all([
    db.projectRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }),
    db.projectRequest.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const countFor = (value: string) =>
    value === 'ALL'
      ? counts.reduce((sum, group) => sum + group._count._all, 0)
      : (counts.find((group) => group.status === value)?._count._all ?? 0);

  return (
    <>
      <AdminPageTitle
        title="Project Requests"
        description="Inquiries from the custom development form, tracked through the pipeline."
      />

      <nav aria-label="Pipeline filter" className="mb-5 flex flex-wrap gap-2">
        {pipeline.map((stage) => (
          <Link
            key={stage}
            href={stage === 'ALL' ? '/admin/requests' : `/admin/requests?status=${stage}`}
            aria-current={status === stage ? 'page' : undefined}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[0.78rem] font-medium transition-colors',
              status === stage
                ? 'border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent'
                : 'border-line bg-panel text-muted hover:border-line-strong hover:text-ink'
            )}
          >
            {stage === 'ALL' ? 'All' : stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            <span className="ml-1.5 font-mono text-[0.68rem] opacity-70">{countFor(stage)}</span>
          </Link>
        ))}
      </nav>

      {requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests in this stage"
          description="New submissions from /custom-development will appear here."
        />
      ) : (
        <AdminPanel padded={false}>
          <ul className="divide-y divide-line">
            {requests.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/admin/requests/${request.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-panel-strong"
                >
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="truncate text-[0.9rem] font-medium text-ink">{request.title}</p>
                    <p className="truncate text-[0.75rem] text-faint">
                      {request.name}
                      {request.company ? ` · ${request.company}` : ''} · {request.email}
                    </p>
                  </div>
                  <span className="hidden font-mono text-[0.72rem] text-muted md:block">{request.category}</span>
                  <span className="hidden font-mono text-[0.72rem] text-muted lg:block">{request.budget}</span>
                  <StatusBadge status={request.priority} />
                  <StatusBadge status={request.status} />
                  <span className="w-16 text-right font-mono text-[0.68rem] text-faint">
                    {timeAgo(request.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </AdminPanel>
      )}
    </>
  );
}
