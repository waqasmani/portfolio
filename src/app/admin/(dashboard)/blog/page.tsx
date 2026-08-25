import Link from 'next/link';
import { FileText, Plus, Star } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDate, formatNumber } from '@/lib/utils';
import { AdminPageTitle, AdminPanel } from '@/components/admin/ui';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonStyles } from '@/components/ui/button';
import { DeleteButton } from '@/components/admin/inquiry-actions';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  await requireUser();
  const posts = await db.blogPost.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      status: true,
      featured: true,
      views: true,
      readingTime: true,
      publishedAt: true,
      scheduledFor: true,
      updatedAt: true,
    },
  });

  return (
    <>
      <AdminPageTitle
        title="Blog"
        description="Write, edit, schedule, and publish articles."
        actions={
          <Link href="/admin/blog/new" className={buttonStyles('primary', 'sm')}>
            <Plus className="size-4" aria-hidden />
            New article
          </Link>
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No articles yet"
          description="Write your first article — Markdown in, premium reading experience out."
          action={
            <Link href="/admin/blog/new" className={buttonStyles('primary', 'sm')}>
              <Plus className="size-4" aria-hidden />
              New article
            </Link>
          }
        />
      ) : (
        <AdminPanel padded={false}>
          <ul className="divide-y divide-line">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                <div className="min-w-0 flex-1 basis-72">
                  <p className="flex items-center gap-2 text-[0.9rem] font-medium text-ink">
                    {post.featured && <Star className="size-3.5 fill-amber text-amber" aria-label="Featured" />}
                    <Link href={`/admin/blog/${post.id}`} className="truncate hover:text-accent">
                      {post.title}
                    </Link>
                  </p>
                  <p className="truncate text-[0.75rem] text-faint">
                    {post.category} ·{' '}
                    {post.status === 'SCHEDULED' && post.scheduledFor
                      ? `scheduled ${formatDate(post.scheduledFor)}`
                      : post.publishedAt
                        ? `published ${formatDate(post.publishedAt)}`
                        : `updated ${formatDate(post.updatedAt)}`}
                  </p>
                </div>
                <span className="hidden font-mono text-[0.72rem] text-muted sm:block">
                  {formatNumber(post.views)} reads
                </span>
                <span className="hidden font-mono text-[0.72rem] text-faint md:block">{post.readingTime} min</span>
                <StatusBadge status={post.status} />
                <div className="flex items-center gap-1">
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="rounded-lg px-2.5 py-1.5 text-[0.78rem] font-medium text-muted transition-colors hover:bg-panel-strong hover:text-ink"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/blog/${post.id}`}
                    className="rounded-lg px-2.5 py-1.5 text-[0.78rem] font-medium text-accent transition-colors hover:bg-panel-strong"
                  >
                    Edit
                  </Link>
                  <DeleteButton endpoint={`/api/admin/posts/${post.id}`} />
                </div>
              </li>
            ))}
          </ul>
        </AdminPanel>
      )}
    </>
  );
}
