import Link from 'next/link';
import { FolderKanban, Plus, Star } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { projectCategoryLabel } from '@/config/site';
import { formatNumber } from '@/lib/utils';
import { AdminPageTitle, AdminPanel } from '@/components/admin/ui';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonStyles } from '@/components/ui/button';
import { DeleteButton } from '@/components/admin/inquiry-actions';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  await requireUser('ADMIN');
  const projects = await db.project.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <>
      <AdminPageTitle
        title="Projects"
        description="Portfolio projects and their case studies."
        actions={
          <Link href="/admin/projects/new" className={buttonStyles('primary', 'sm')}>
            <Plus className="size-4" aria-hidden />
            New project
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to populate the portfolio."
          action={
            <Link href="/admin/projects/new" className={buttonStyles('primary', 'sm')}>
              <Plus className="size-4" aria-hidden />
              New project
            </Link>
          }
        />
      ) : (
        <AdminPanel padded={false}>
          <ul className="divide-y divide-line">
            {projects.map((project) => (
              <li key={project.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="flex items-center gap-2 text-[0.9rem] font-medium text-ink">
                    {project.featured && <Star className="size-3.5 fill-amber text-amber" aria-label="Featured" />}
                    <Link href={`/admin/projects/${project.id}`} className="truncate hover:text-accent">
                      {project.title}
                    </Link>
                  </p>
                  <p className="truncate text-[0.75rem] text-faint">
                    /{project.slug} · {projectCategoryLabel(project.category)}
                  </p>
                </div>
                <span className="hidden font-mono text-[0.72rem] text-muted sm:block">
                  {formatNumber(project.views)} views
                </span>
                <span className="hidden font-mono text-[0.72rem] text-faint md:block">#{project.sortOrder}</span>
                <StatusBadge status={project.status} />
                <div className="flex items-center gap-1">
                  <Link
                    href={`/projects/${project.slug}`}
                    target="_blank"
                    className="rounded-lg px-2.5 py-1.5 text-[0.78rem] font-medium text-muted transition-colors hover:bg-panel-strong hover:text-ink"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="rounded-lg px-2.5 py-1.5 text-[0.78rem] font-medium text-accent transition-colors hover:bg-panel-strong"
                  >
                    Edit
                  </Link>
                  <DeleteButton endpoint={`/api/admin/projects/${project.id}`} />
                </div>
              </li>
            ))}
          </ul>
        </AdminPanel>
      )}
    </>
  );
}
