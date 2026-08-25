import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import type { PostUpsertInput } from '@/lib/schemas';
import { AdminPageTitle } from '@/components/admin/ui';
import { PostEditor } from '@/components/admin/post-editor';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  const initial: PostUpsertInput = {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    tags: post.tags,
    accent: post.accent,
    status: post.status,
    featured: post.featured,
    seoTitle: post.seoTitle ?? '',
    seoDescription: post.seoDescription ?? '',
    scheduledFor: post.scheduledFor ? post.scheduledFor.toISOString() : null,
  };

  return (
    <>
      <Link
        href="/admin/blog"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All articles
      </Link>
      <AdminPageTitle title={`Edit: ${post.title}`} description={`/blog/${post.slug}`} />
      <PostEditor postId={post.id} initial={initial} />
    </>
  );
}
