import type { Metadata } from 'next';
import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { projectCategories } from '@/config/site';
import { getPublishedProjects } from '@/lib/content';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/site/page-header';
import { FeaturedProjectCard, ProjectCard } from '@/components/site/project-card';
import { Reveal } from '@/components/motion/reveal';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonStyles } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Selected full stack projects with complete case studies — SaaS platforms, e-commerce, CRMs, APIs, and open source, each with architecture decisions and measured results.',
  alternates: { canonical: '/projects' },
};

const filters = [{ value: 'ALL', label: 'All' }, ...projectCategories];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = filters.some((filter) => filter.value === params.category)
    ? (params.category as string)
    : 'ALL';

  const allProjects = await getPublishedProjects();
  const projects =
    activeCategory === 'ALL'
      ? allProjects
      : allProjects.filter((project) => project.category === activeCategory);

  const [first, ...rest] = projects;
  const showFeatured = activeCategory === 'ALL' && first?.featured;

  return (
    <>
      <PageHeader
        eyebrow="Selected Work"
        title={
          <>
            Projects, with the <span className="text-gradient">decisions</span> behind them
          </>
        }
        description="Every project links to a full case study: the problem, the architecture, the trade-offs, and what measurably changed. Filter by the kind of work you're planning."
      >
        {/* Category filter — server-rendered links: shareable and SEO-friendly */}
        <nav aria-label="Project categories" className="mt-8 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = filter.value === activeCategory;
            return (
              <Link
                key={filter.value}
                href={filter.value === 'ALL' ? '/projects' : `/projects?category=${filter.value}`}
                scroll={false}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-[0.82rem] font-medium transition-all',
                  active
                    ? 'border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent'
                    : 'border-line bg-panel text-muted hover:border-line-strong hover:text-ink'
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>
      </PageHeader>

      <section className="shell py-14 md:py-20" aria-live="polite">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Nothing in this category yet"
            description="More case studies are being written up. In the meantime, browse everything or tell me about the project you have in mind."
            action={
              <Link href="/projects" className={buttonStyles('secondary', 'sm')}>
                Show all projects
              </Link>
            }
          />
        ) : (
          <>
            {showFeatured && first && (
              <Reveal className="mb-8" y={26}>
                <FeaturedProjectCard project={first} />
              </Reveal>
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(showFeatured ? rest : projects).map((project, index) => (
                <Reveal key={project.id} delay={Math.min(index, 5) * 0.06} className="h-full">
                  <ProjectCard project={project} className="h-full" />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
