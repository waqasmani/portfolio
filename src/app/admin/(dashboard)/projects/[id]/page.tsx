import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import type { ProjectUpsertInput } from '@/lib/schemas';
import { AdminPageTitle } from '@/components/admin/ui';
import { ProjectEditor } from '@/components/admin/project-editor';
import type { ArchitectureData } from '@/components/site/architecture-diagram';

export const dynamic = 'force-dynamic';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser('ADMIN');
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) notFound();

  const architecture = (project.architecture ?? {}) as ArchitectureData;
  const initial: ProjectUpsertInput = {
    slug: project.slug,
    title: project.title,
    tagline: project.tagline,
    description: project.description,
    category: project.category,
    clientType: project.clientType ?? '',
    year: project.year,
    featured: project.featured,
    sortOrder: project.sortOrder,
    status: project.status === 'SCHEDULED' ? 'PUBLISHED' : project.status,
    accent: project.accent,
    problem: project.problem ?? '',
    solution: project.solution ?? '',
    challenges: (Array.isArray(project.challenges) ? project.challenges : []) as ProjectUpsertInput['challenges'],
    architecture: {
      frontend: architecture.frontend ?? [],
      backend: architecture.backend ?? [],
      database: architecture.database ?? [],
      infrastructure: architecture.infrastructure ?? [],
      services: architecture.services ?? [],
    },
    results: (Array.isArray(project.results) ? project.results : []) as ProjectUpsertInput['results'],
    gallery: (Array.isArray(project.gallery) ? project.gallery : []) as ProjectUpsertInput['gallery'],
    stack: project.stack,
    liveUrl: project.liveUrl ?? '',
    githubUrl: project.githubUrl ?? '',
  };

  return (
    <>
      <Link
        href="/admin/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All projects
      </Link>
      <AdminPageTitle title={`Edit: ${project.title}`} description={`/projects/${project.slug}`} />
      <ProjectEditor projectId={project.id} initial={initial} />
    </>
  );
}
