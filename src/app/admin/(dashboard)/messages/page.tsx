import { Mail } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDateTime } from '@/lib/utils';
import { AdminPageTitle, AdminPanel } from '@/components/admin/ui';
import { EmptyState } from '@/components/ui/empty-state';
import { DeleteButton, StatusSelect } from '@/components/admin/inquiry-actions';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  await requireUser();
  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <>
      <AdminPageTitle title="Contact Messages" description="Everything from the contact form, newest first." />

      {messages.length === 0 ? (
        <EmptyState icon={Mail} title="Inbox zero" description="New contact form submissions will land here." />
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <AdminPanel key={message.id} padded={false}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-[0.95rem] font-semibold text-ink">{message.subject}</h2>
                  <p className="mt-0.5 text-[0.78rem] text-muted">
                    <a href={`mailto:${message.email}`} className="font-medium text-accent hover:underline">
                      {message.name}
                    </a>
                    {message.company ? ` · ${message.company}` : ''} · {formatDateTime(message.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusSelect id={message.id} status={message.status} kind="message" />
                  <DeleteButton endpoint={`/api/admin/messages/${message.id}`} />
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted">{message.message}</p>
                {(message.projectType || message.budget) && (
                  <p className="mt-3 border-t border-line pt-3 font-mono text-[0.72rem] text-faint">
                    {[message.projectType, message.budget].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </AdminPanel>
          ))}
        </div>
      )}
    </>
  );
}
