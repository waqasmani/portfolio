import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { AdminPageTitle } from '@/components/admin/ui';
import { PostEditor } from '@/components/admin/post-editor';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  await requireUser();
  return (
    <>
      <Link
        href="/admin/blog"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All articles
      </Link>
      <AdminPageTitle title="New article" description="Markdown with code highlighting, TOC, and SEO controls." />
      <PostEditor />
    </>
  );
}
