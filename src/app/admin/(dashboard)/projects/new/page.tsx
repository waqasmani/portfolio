import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { AdminPageTitle } from '@/components/admin/ui';
import { ProjectEditor } from '@/components/admin/project-editor';

export const dynamic = 'force-dynamic';

export default async function NewProjectPage() {
  await requireUser('ADMIN');
  return (
    <>
      <Link
        href="/admin/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All projects
      </Link>
      <AdminPageTitle title="New project" description="Create a portfolio project with its full case study." />
      <ProjectEditor />
    </>
  );
}
