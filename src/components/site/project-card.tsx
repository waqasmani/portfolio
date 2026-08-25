import Link from 'next/link';
import { ArrowUpRight, BookOpen, ExternalLink } from 'lucide-react';
import type { Project } from '@/generated/prisma/client';
import { projectCategoryLabel } from '@/config/site';
import { cn } from '@/lib/utils';
import { Badge, TechChip } from '@/components/ui/badge';
import { CoverArt } from '@/components/ui/cover-art';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { TrackedExternalLink } from '@/components/site/tracked-link';
import { buttonStyles } from '@/components/ui/button';
import { GithubIcon } from '@/components/ui/social-icons';

type ProjectResult = { value: string; metric: string; description?: string };

function projectResults(project: Project): ProjectResult[] {
  return Array.isArray(project.results) ? (project.results as ProjectResult[]) : [];
}

export function ProjectCard({ project, className }: { project: Project; className?: string }) {
  return (
    <SpotlightCard
      className={cn(
        'card-lift group relative flex flex-col rounded-2xl border border-line bg-panel',
        className
      )}
    >
      {/* Cover */}
      <div className="relative m-2 aspect-[16/10] overflow-hidden rounded-xl border border-line">
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.045]">
          <CoverArt seed={project.slug} accent={project.accent} glyph={project.title[0]} />
        </div>
        <Badge tone="accent" className="absolute top-3 left-3 backdrop-blur-sm">
          {projectCategoryLabel(project.category)}
        </Badge>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 pt-3">
        <h3 className="flex items-center justify-between gap-2 text-[1.05rem] font-semibold text-ink">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
          <ArrowUpRight
            className="size-4.5 shrink-0 text-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
            aria-hidden
          />
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{project.tagline}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 4).map((tech) => (
            <TechChip key={tech}>{tech}</TechChip>
          ))}
          {project.stack.length > 4 && <TechChip>+{project.stack.length - 4}</TechChip>}
        </div>

        {/* Actions — kept above the card-covering link */}
        <div className="relative z-10 mt-5 flex items-center gap-2 border-t border-line pt-4">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-accent transition-colors hover:text-accent-strong"
          >
            <BookOpen className="size-3.5" aria-hidden />
            Case Study
          </Link>
          {project.liveUrl && (
            <TrackedExternalLink
              href={project.liveUrl}
              event="demo_clicked"
              className="ml-auto inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-muted transition-colors hover:text-ink"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Live
            </TrackedExternalLink>
          )}
          {project.githubUrl && (
            <TrackedExternalLink
              href={project.githubUrl}
              event="github_clicked"
              className={cn(
                'inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-muted transition-colors hover:text-ink',
                !project.liveUrl && 'ml-auto'
              )}
            >
              <GithubIcon className="size-3.5" aria-hidden />
              GitHub
            </TrackedExternalLink>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}

/** Larger editorial layout used for the featured project. */
export function FeaturedProjectCard({ project }: { project: Project }) {
  const results = projectResults(project).slice(0, 3);
  return (
    <SpotlightCard className="card-lift group relative overflow-hidden rounded-3xl border border-line bg-panel">
      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        {/* Cover */}
        <div className="relative m-2 aspect-[16/10] overflow-hidden rounded-2xl border border-line lg:m-3 lg:aspect-auto lg:min-h-[26rem]">
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.035]">
            <CoverArt seed={project.slug} accent={project.accent} glyph={project.title[0]} />
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge tone="amber">Featured</Badge>
            <Badge tone="accent" className="backdrop-blur-sm">
              {projectCategoryLabel(project.category)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <p className="font-mono text-[0.72rem] tracking-[0.14em] text-faint uppercase">
            {project.clientType ?? 'Case study'} {project.year ? `· ${project.year}` : ''}
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
              {project.title}
            </Link>
          </h3>
          <p className="mt-3 leading-relaxed text-muted">{project.description.split('. ')[0]}.</p>

          {results.length > 0 && (
            <dl className="mt-6 grid grid-cols-3 gap-3">
              {results.map((result) => (
                <div
                  key={result.metric}
                  className="flex flex-col-reverse rounded-xl border border-line bg-panel px-3 py-2.5"
                >
                  <dt className="text-[0.68rem] leading-tight text-faint">{result.metric}</dt>
                  <dd className="text-gradient text-lg font-bold tracking-tight">{result.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6 flex flex-wrap gap-1.5">
            {project.stack.slice(0, 6).map((tech) => (
              <TechChip key={tech}>{tech}</TechChip>
            ))}
          </div>

          <div className="relative z-10 mt-7 flex flex-wrap items-center gap-3">
            <Link href={`/projects/${project.slug}`} className={buttonStyles('primary', 'md')}>
              Read the case study
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            {project.githubUrl && (
              <TrackedExternalLink
                href={project.githubUrl}
                event="github_clicked"
                className={buttonStyles('secondary', 'md')}
              >
                <GithubIcon className="size-4" aria-hidden />
                GitHub
              </TrackedExternalLink>
            )}
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
