import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Images,
  Layers3,
  Target,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { projectCategoryLabel, siteUrl } from '@/config/site';
import { getAdjacentProjects, getProjectBySlug, incrementProjectViews } from '@/lib/content';
import { PageHeaderless } from '@/components/site/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { CoverArt } from '@/components/ui/cover-art';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { ArchitectureDiagram, type ArchitectureData } from '@/components/site/architecture-diagram';
import { TechIcon } from '@/components/ui/tech-icon';
import { TrackedExternalLink } from '@/components/site/tracked-link';
import { buttonStyles } from '@/components/ui/button';
import { GithubIcon } from '@/components/ui/social-icons';
import { JsonLd } from '@/components/site/json-ld';

export const dynamic = 'force-dynamic';

interface Params {
  slug: string;
}

type Challenge = { title: string; challenge: string; solution: string };
type ProjectResult = { value: string; metric: string; description?: string };
type GalleryItem = { title: string; description?: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: 'Project not found' };
  return {
    title: `${project.title} — Case Study`,
    description: project.tagline,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: `${project.title} — Case Study`,
      description: project.tagline,
      type: 'article',
      url: `${siteUrl}/projects/${project.slug}`,
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  after(() => incrementProjectViews(project.id));

  const { previous, next } = await getAdjacentProjects(project.sortOrder);
  const challenges = (Array.isArray(project.challenges) ? project.challenges : []) as Challenge[];
  const results = (Array.isArray(project.results) ? project.results : []) as ProjectResult[];
  const gallery = (Array.isArray(project.gallery) ? project.gallery : []) as GalleryItem[];
  const architecture = (project.architecture ?? {}) as ArchitectureData;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          description: project.tagline,
          url: `${siteUrl}/projects/${project.slug}`,
          dateCreated: project.year ? `${project.year}` : undefined,
          keywords: project.stack.join(', '),
        }}
      />

      {/* Header */}
      <header className="noise relative overflow-hidden border-b border-line">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(55% 65% at 50% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 72%)',
          }}
        />
        <div className="shell relative py-12 md:py-16">
          <PageHeaderless
            items={[
              { label: 'Projects', href: '/projects' },
              { label: project.title },
            ]}
          />

          <Reveal>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{projectCategoryLabel(project.category)}</Badge>
              {project.featured && <Badge tone="amber">Featured</Badge>}
              {project.year && <Badge>{project.year}</Badge>}
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-balance text-ink sm:text-5xl md:text-6xl">
              {project.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{project.tagline}</p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {project.liveUrl && (
                <TrackedExternalLink
                  href={project.liveUrl}
                  event="demo_clicked"
                  className={buttonStyles('primary', 'md')}
                >
                  Live Demo
                  <ExternalLink className="size-4" aria-hidden />
                </TrackedExternalLink>
              )}
              {project.githubUrl && (
                <TrackedExternalLink
                  href={project.githubUrl}
                  event="github_clicked"
                  className={buttonStyles('secondary', 'md')}
                >
                  <GithubIcon className="size-4" />
                  View Source
                </TrackedExternalLink>
              )}
              <Link href="/custom-development" className={buttonStyles('ghost', 'md')}>
                Build something similar
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </Reveal>

          {/* Meta strip */}
          <Reveal delay={0.12}>
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
              {[
                { label: 'Type', value: project.clientType ?? projectCategoryLabel(project.category) },
                { label: 'Year', value: project.year ? String(project.year) : '—' },
                { label: 'Core stack', value: project.stack.slice(0, 3).join(' · ') },
                { label: 'Case study views', value: project.views.toLocaleString('en-US') },
              ].map((item) => (
                <div key={item.label} className="bg-bg px-5 py-4">
                  <dt className="font-mono text-[0.66rem] tracking-[0.14em] text-faint uppercase">
                    {item.label}
                  </dt>
                  <dd className="mt-1.5 text-[0.9rem] font-medium text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </header>

      {/* Cover */}
      <section className="shell pt-10 md:pt-14" aria-hidden>
        <Reveal y={26}>
          <div className="relative aspect-[21/9] overflow-hidden rounded-3xl border border-line-strong shadow-[var(--shadow-soft)]">
            <CoverArt seed={project.slug} accent={project.accent} glyph={project.title[0]} />
          </div>
        </Reveal>
      </section>

      {/* Overview */}
      <section className="shell py-16 md:py-24" aria-labelledby="overview-title">
        <SectionHeading eyebrow="Overview" title={<span id="overview-title">The project</span>} />
        <div className="max-w-3xl">
          <Reveal>
            <p className="text-[1.05rem] leading-relaxed text-muted">{project.description}</p>
          </Reveal>
        </div>

        {(project.problem || project.solution) && (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {project.problem && (
              <Reveal className="h-full">
                <div className="h-full rounded-2xl border border-line bg-panel p-6 sm:p-7">
                  <h3 className="flex items-center gap-2.5 text-[1.02rem] font-semibold text-ink">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--rose)_13%,transparent)]">
                      <CircleAlert className="size-4.5 text-rose" aria-hidden />
                    </span>
                    The problem
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{project.problem}</p>
                </div>
              </Reveal>
            )}
            {project.solution && (
              <Reveal delay={0.08} className="h-full">
                <div className="h-full rounded-2xl border border-line bg-panel p-6 sm:p-7">
                  <h3 className="flex items-center gap-2.5 text-[1.02rem] font-semibold text-ink">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--emerald)_13%,transparent)]">
                      <CircleCheck className="size-4.5 text-emerald" aria-hidden />
                    </span>
                    The solution
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{project.solution}</p>
                </div>
              </Reveal>
            )}
          </div>
        )}
      </section>

      {/* Results */}
      {results.length > 0 && (
        <section className="border-y border-line bg-bg-raised/40" aria-labelledby="results-title">
          <div className="shell py-16 md:py-20">
            <SectionHeading
              eyebrow="Results"
              title={
                <span id="results-title" className="flex items-center gap-3">
                  What measurably changed
                  <TrendingUp className="size-6 text-emerald" aria-hidden />
                </span>
              }
            />
            <dl className={`grid gap-4 sm:grid-cols-2 ${results.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
              {results.map((result, index) => (
                <Reveal key={result.metric} delay={0.06 * index} className="h-full">
                  <div className="flex h-full flex-col-reverse justify-end rounded-2xl border border-line bg-panel p-6">
                    <dt className="mt-1 text-[0.85rem] font-medium text-ink">{result.metric}</dt>
                    <dd className="text-gradient text-4xl font-bold tracking-tight">{result.value}</dd>
                    {result.description && (
                      <p className="order-first mt-2 pt-2 text-[0.78rem] leading-relaxed text-faint">
                        {result.description}
                      </p>
                    )}
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Architecture */}
      <section className="shell py-16 md:py-24" aria-labelledby="architecture-title">
        <SectionHeading
          eyebrow="Architecture"
          title={
            <span id="architecture-title" className="flex items-center gap-3">
              How it fits together
              <Layers3 className="size-6 text-accent" aria-hidden />
            </span>
          }
          description="The system at a glance — request flow on the left, the platform it runs on and the services it talks to on the right."
        />
        <Reveal y={24}>
          <ArchitectureDiagram architecture={architecture} />
        </Reveal>
      </section>

      {/* Challenges */}
      {challenges.length > 0 && (
        <section className="border-t border-line" aria-labelledby="challenges-title">
          <div className="shell py-16 md:py-24">
            <SectionHeading
              eyebrow="Engineering"
              title={
                <span id="challenges-title" className="flex items-center gap-3">
                  Challenges &amp; how they fell
                  <Wrench className="size-6 text-amber" aria-hidden />
                </span>
              }
            />
            <div className="space-y-5">
              {challenges.map((challenge, index) => (
                <Reveal key={challenge.title} delay={0.05 * index}>
                  <article className="overflow-hidden rounded-2xl border border-line bg-panel">
                    <h3 className="border-b border-line px-6 py-4 text-[1.02rem] font-semibold text-ink">
                      <span className="mr-3 font-mono text-[0.8rem] text-accent">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {challenge.title}
                    </h3>
                    <div className="grid gap-px bg-line md:grid-cols-2">
                      <div className="bg-bg p-6">
                        <p className="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.14em] text-rose uppercase">
                          <Target className="size-3.5" aria-hidden />
                          Challenge
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-muted">{challenge.challenge}</p>
                      </div>
                      <div className="bg-bg p-6">
                        <p className="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.14em] text-emerald uppercase">
                          <CircleCheck className="size-3.5" aria-hidden />
                          Solution
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-muted">{challenge.solution}</p>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stack */}
      <section className="border-t border-line" aria-labelledby="stack-title">
        <div className="shell py-16 md:py-20">
          <SectionHeading eyebrow="Stack" title={<span id="stack-title">Technology used</span>} />
          <div className="flex flex-wrap gap-2.5">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 text-[0.82rem] text-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                <TechIcon name={tech} className="size-4" />
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="border-t border-line" aria-labelledby="gallery-title">
          <div className="shell py-16 md:py-24">
            <SectionHeading
              eyebrow="Gallery"
              title={
                <span id="gallery-title" className="flex items-center gap-3">
                  Inside the product
                  <Images className="size-6 text-sky" aria-hidden />
                </span>
              }
              description="Interface highlights from the shipped product (client work is shown as abstracted representations to respect confidentiality)."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item, index) => (
                <Reveal key={item.title} delay={0.06 * index}>
                  <figure className="group overflow-hidden rounded-2xl border border-line bg-panel">
                    <div className="relative m-2 aspect-[16/10] overflow-hidden rounded-xl border border-line">
                      <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
                        <CoverArt seed={`${project.slug}-${index + 2}`} accent={project.accent} />
                      </div>
                      <span className="absolute right-3 bottom-3 rounded-md border border-line bg-bg/70 px-2 py-0.5 font-mono text-[0.65rem] text-muted backdrop-blur-sm">
                        {String(index + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}
                      </span>
                    </div>
                    <figcaption className="px-5 pt-2 pb-5">
                      <p className="text-[0.92rem] font-semibold text-ink">{item.title}</p>
                      {item.description && (
                        <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">{item.description}</p>
                      )}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Prev / next */}
      <nav aria-label="More projects" className="border-t border-line">
        <div className="shell grid gap-4 py-10 sm:grid-cols-2">
          {previous ? (
            <Link
              href={`/projects/${previous.slug}`}
              className="group rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-line-strong"
            >
              <p className="flex items-center gap-1.5 font-mono text-[0.68rem] tracking-[0.14em] text-faint uppercase">
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
                Previous project
              </p>
              <p className="mt-2 font-semibold text-ink">{previous.title}</p>
            </Link>
          ) : (
            <span aria-hidden />
          )}
          {next ? (
            <Link
              href={`/projects/${next.slug}`}
              className="group rounded-2xl border border-line bg-panel p-5 text-right transition-colors hover:border-line-strong"
            >
              <p className="flex items-center justify-end gap-1.5 font-mono text-[0.68rem] tracking-[0.14em] text-faint uppercase">
                Next project
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </p>
              <p className="mt-2 font-semibold text-ink">{next.title}</p>
            </Link>
          ) : (
            <span aria-hidden />
          )}
        </div>
      </nav>
    </>
  );
}
