import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Paperclip } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatBytes, formatDateTime } from '@/lib/utils';
import { briefSchema } from '@/lib/schemas';
import { AdminPageTitle, AdminPanel } from '@/components/admin/ui';
import { StatusBadge, TechChip } from '@/components/ui/badge';
import { BriefView } from '@/components/request/brief-view';
import { DeleteButton, NotesEditor, StatusSelect } from '@/components/admin/inquiry-actions';

export const dynamic = 'force-dynamic';

interface AttachmentMeta {
  name: string;
  size: number;
  type: string;
  key?: string;
}

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser('ADMIN');
  const { id } = await params;
  const request = await db.projectRequest.findUnique({ where: { id } });
  if (!request) notFound();

  const attachments = (
    Array.isArray(request.attachments) ? request.attachments : []
  ) as unknown as AttachmentMeta[];
  const brief = request.aiBrief ? briefSchema.safeParse(request.aiBrief) : null;

  return (
    <>
      <Link
        href="/admin/requests"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All requests
      </Link>

      <AdminPageTitle
        title={request.title}
        description={`Submitted ${formatDateTime(request.createdAt)}`}
        actions={
          <>
            <StatusSelect id={request.id} status={request.status} kind="request" />
            <DeleteButton endpoint={`/api/admin/requests/${request.id}`} redirectTo="/admin/requests" />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <AdminPanel title="Description">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted">{request.description}</p>
            {request.technologies.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
                {request.technologies.map((tech) => (
                  <TechChip key={tech}>{tech}</TechChip>
                ))}
              </div>
            )}
          </AdminPanel>

          {brief?.success && (
            <AdminPanel title="AI-generated brief (as the client saw it)">
              <BriefView brief={brief.data} />
            </AdminPanel>
          )}

          <AdminPanel title="Internal notes">
            <NotesEditor id={request.id} notes={request.notes} />
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel title="Client">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[0.7rem] tracking-wide text-faint uppercase">Name</dt>
                <dd className="mt-0.5 font-medium text-ink">{request.name}</dd>
              </div>
              <div>
                <dt className="text-[0.7rem] tracking-wide text-faint uppercase">Email</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${request.email}?subject=Re: ${encodeURIComponent(request.title)}`}
                    className="flex items-center gap-1.5 font-medium text-accent hover:text-accent-strong"
                  >
                    <Mail className="size-3.5" aria-hidden />
                    {request.email}
                  </a>
                </dd>
              </div>
              {request.company && (
                <div>
                  <dt className="text-[0.7rem] tracking-wide text-faint uppercase">Company</dt>
                  <dd className="mt-0.5 text-ink">{request.company}</dd>
                </div>
              )}
            </dl>
          </AdminPanel>

          <AdminPanel title="Parameters">
            <dl className="space-y-3 text-sm">
              {[
                ['Category', request.category],
                ['Budget', request.budget],
                ['Deadline', request.deadline ?? 'Flexible'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Priority</dt>
                <dd>
                  <StatusBadge status={request.priority} />
                </dd>
              </div>
            </dl>
          </AdminPanel>

          <AdminPanel title={`Attachments (${attachments.length})`}>
            {attachments.length === 0 ? (
              <p className="text-sm text-faint">No files attached</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((attachment, index) => (
                  <li key={index}>
                    {attachment.key ? (
                      <a
                        href={`/api/admin/uploads?key=${encodeURIComponent(attachment.key)}`}
                        className="flex items-center gap-3 rounded-xl border border-line bg-bg-raised px-3.5 py-2.5 transition-colors hover:border-line-strong"
                      >
                        <Paperclip className="size-4 shrink-0 text-accent" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-[0.82rem] text-ink underline-offset-2 hover:underline">
                          {attachment.name}
                        </span>
                        <span className="font-mono text-[0.68rem] text-faint">{formatBytes(attachment.size)}</span>
                      </a>
                    ) : (
                      <span className="flex items-center gap-3 rounded-xl border border-line bg-bg-raised px-3.5 py-2.5 opacity-70">
                        <Paperclip className="size-4 shrink-0 text-faint" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-[0.82rem] text-muted">{attachment.name}</span>
                        <span className="font-mono text-[0.68rem] text-faint">metadata only</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        </div>
      </div>
    </>
  );
}
