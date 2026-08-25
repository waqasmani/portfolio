import { Quote } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { AdminPageTitle, AdminPanel } from '@/components/admin/ui';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { DeleteButton } from '@/components/admin/inquiry-actions';
import { TestimonialEditorButton } from '@/components/admin/testimonial-manager';

export const dynamic = 'force-dynamic';

export default async function AdminTestimonialsPage() {
  await requireUser();
  const testimonials = await db.testimonial.findMany({ orderBy: { sortOrder: 'asc' } });

  return (
    <>
      <AdminPageTitle
        title="Testimonials"
        description="Client quotes shown in the home page carousel."
        actions={<TestimonialEditorButton variant="new" />}
      />

      {testimonials.length === 0 ? (
        <EmptyState
          icon={Quote}
          title="No testimonials yet"
          description="Add your first client quote to light up the carousel."
          action={<TestimonialEditorButton variant="new" />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <AdminPanel key={testimonial.id} padded={false}>
              <div className="flex items-start gap-4 p-5">
                <Avatar name={testimonial.name} seed={testimonial.avatarSeed} className="size-11" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{testimonial.name}</p>
                    {!testimonial.published && <Badge tone="amber">Hidden</Badge>}
                    {testimonial.projectName && <Badge>{testimonial.projectName}</Badge>}
                  </div>
                  <p className="text-[0.78rem] text-faint">
                    {testimonial.role}, {testimonial.company} · #{testimonial.sortOrder}
                  </p>
                  <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted">
                    “{testimonial.quote}”
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-1 border-t border-line px-4 py-2">
                <TestimonialEditorButton
                  testimonial={{ ...testimonial, projectName: testimonial.projectName }}
                />
                <DeleteButton endpoint={`/api/admin/testimonials/${testimonial.id}`} />
              </div>
            </AdminPanel>
          ))}
        </div>
      )}
    </>
  );
}
