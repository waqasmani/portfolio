import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Boxes,
  Gauge,
  Globe,
  ShoppingCart,
  Workflow,
} from 'lucide-react';
import type { Project, Testimonial } from '@/generated/prisma/client';
import { developer, marqueeTech, skillGroups, stats } from '@/config/site';
import type { SiteSettingsData } from '@/config/site';
import { Marquee } from '@/components/ui/marquee';
import { TechIcon } from '@/components/ui/tech-icon';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { Counter } from '@/components/motion/counter';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { FeaturedProjectCard, ProjectCard } from '@/components/site/project-card';
import { ButtonLink } from '@/components/ui/button';
import { AvailabilityDot, availabilityLabels } from '@/components/site/availability';
import { TestimonialsCarousel } from '@/components/home/testimonials-carousel';

// ---------------------------------------------------------------------------
// Technology marquee
// ---------------------------------------------------------------------------

export function TechMarquee() {
  return (
    <section id="stack" aria-label="Technologies" className="border-y border-line bg-bg-raised/40 py-7">
      <Marquee>
        {marqueeTech.map((tech) => (
          <span key={tech} className="flex items-center gap-2.5 text-muted">
            <TechIcon name={tech} className="size-5 opacity-90" />
            <span className="font-mono text-[0.82rem] whitespace-nowrap">{tech}</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}

// ---------------------------------------------------------------------------
// About preview + animated stats
// ---------------------------------------------------------------------------

export function AboutPreview() {
  return (
    <section className="shell py-24 md:py-32" aria-labelledby="about-heading">
      <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <Reveal>
            <p className="eyebrow">About</p>
            <h2
              id="about-heading"
              className="mt-3.5 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl"
            >
              Engineering partner, not just a pair of hands
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-5 leading-relaxed text-muted">
              {developer.name} is a {developer.title.toLowerCase()} that has spent{' '}
              {developer.yearsOfExperience}+ years building and operating production systems for
              startups, agencies, and established businesses. Our specialty is the unglamorous part:
              platforms that stay fast, stay up, and stay maintainable long after launch.
            </p>
            <p className="mt-4 leading-relaxed text-muted">
              Every engagement gets the same treatment — honest scoping, measurable goals, clean
              architecture, and documentation your next engineer will thank us for.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <Link
              href="/about"
              className="mt-7 inline-flex items-center gap-2 text-[0.9rem] font-medium text-accent transition-colors hover:text-accent-strong"
            >
              More about how we work
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Reveal>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={0.06 * index}>
              <div className="flex flex-col-reverse rounded-2xl border border-line bg-panel p-6">
                <dt className="mt-1.5 text-[0.82rem] text-muted">{stat.label}</dt>
                <dd className="text-4xl font-bold tracking-tight text-ink tabular-nums">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Skills grid
// ---------------------------------------------------------------------------

export function SkillsSection() {
  return (
    <section className="shell py-24 md:py-32" aria-labelledby="skills-title">
      <SectionHeading
        eyebrow="Stack"
        title={
          <span id="skills-title">
            Tools chosen for <span className="text-gradient">outcomes</span>
          </span>
        }
        description="A deliberately boring, battle-tested stack — every tool here has shipped real products and survived real traffic."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {skillGroups.map((group, index) => (
          <Reveal key={group.key} delay={0.07 * index} className="h-full">
            <SpotlightCard className="card-lift h-full rounded-2xl border border-line bg-panel p-6">
              <h3 className="text-[1.02rem] font-semibold text-ink">{group.label}</h3>
              <p className="mt-2 min-h-[3.4rem] text-[0.84rem] leading-relaxed text-muted">
                {group.blurb}
              </p>
              <ul className="mt-5 space-y-2.5">
                {group.skills.map((skill) => (
                  <li
                    key={skill}
                    className="group/skill flex items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-line hover:bg-panel-strong"
                  >
                    <TechIcon name={skill} className="size-4.5" />
                    <span className="text-[0.86rem] text-muted transition-colors group-hover/skill:text-ink">
                      {skill}
                    </span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Featured projects
// ---------------------------------------------------------------------------

export function FeaturedProjects({ projects }: { projects: Project[] }) {
  const [featured, ...rest] = projects;
  if (!featured) return null;

  return (
    <section className="shell py-24 md:py-32" aria-labelledby="projects-title">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Selected Work"
          title={<span id="projects-title">Projects with receipts</span>}
          description="Case studies with architecture decisions, trade-offs, and measured results — not just screenshots."
          className="mb-0 md:mb-0"
        />
        <Reveal delay={0.1}>
          <ButtonLink href="/projects" variant="secondary" size="md" className="mb-1">
            All projects
            <ArrowUpRight className="size-4" aria-hidden />
          </ButtonLink>
        </Reveal>
      </div>

      <Reveal className="mt-12" y={28}>
        <FeaturedProjectCard project={featured} />
      </Reveal>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {rest.slice(0, 3).map((project, index) => (
          <Reveal key={project.id} delay={0.07 * index} className="h-full">
            <ProjectCard project={project} className="h-full" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Services strip
// ---------------------------------------------------------------------------

const serviceTiles = [
  { icon: Globe, label: 'Full Stack Development', href: '/services#full-stack' },
  { icon: Boxes, label: 'SaaS Platforms', href: '/services#saas' },
  { icon: ShoppingCart, label: 'E-Commerce', href: '/services#ecommerce' },
  { icon: Workflow, label: 'CRM & Business Systems', href: '/services#crm' },
  { icon: Blocks, label: 'API Development', href: '/services#api' },
  { icon: Gauge, label: 'Performance & Infra', href: '/services#infrastructure' },
];

export function ServicesStrip() {
  return (
    <section className="border-y border-line bg-bg-raised/40" aria-labelledby="services-strip-title">
      <div className="shell py-16 md:py-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="services-strip-title" className="text-xl font-semibold tracking-tight text-ink">
            What we can take off your plate
          </h2>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-accent transition-colors hover:text-accent-strong"
          >
            Explore services
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {serviceTiles.map((service, index) => (
            <Reveal key={service.href} delay={0.05 * index}>
              <Link
                href={service.href}
                className="group flex h-full flex-col items-start gap-3 rounded-xl border border-line bg-panel p-4 transition-all hover:-translate-y-1 hover:border-line-strong hover:bg-panel-strong"
              >
                <service.icon className="size-5 text-accent" aria-hidden />
                <span className="text-[0.82rem] leading-snug font-medium text-muted transition-colors group-hover:text-ink">
                  {service.label}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;
  return (
    <section className="shell py-24 md:py-32" aria-labelledby="testimonials-title">
      <SectionHeading
        eyebrow="Testimonials"
        title={<span id="testimonials-title">Clients who came back</span>}
        description="Most of our work comes from referrals and repeat engagements. Here's why."
        align="center"
      />
      <TestimonialsCarousel testimonials={testimonials} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Availability + closing CTA
// ---------------------------------------------------------------------------

export function CtaSection({ settings }: { settings: SiteSettingsData }) {
  return (
    <section className="shell pb-24 md:pb-32" aria-labelledby="cta-title">
      <Reveal y={28}>
        <div className="noise relative overflow-hidden rounded-3xl border border-line bg-bg-raised px-6 py-14 text-center sm:px-12 md:py-20">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 90% at 50% 0%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 70%)',
            }}
          />
          <div className="bg-grid absolute inset-0" aria-hidden />

          <div className="relative">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-panel px-4 py-1.5 text-[0.8rem] font-medium text-muted">
              <AvailabilityDot availability={settings.availability} />
              {availabilityLabels[settings.availability]} · next start {settings.nextAvailableDate}
            </span>
            <h2
              id="cta-title"
              className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-balance text-ink sm:text-5xl"
            >
              Have a project in mind? Let&apos;s build it{' '}
              <span className="text-gradient">properly</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted">
              Tell us what you&apos;re trying to ship. Every serious inquiry gets a personal reply
              within {settings.responseTime.toLowerCase()} — honest feedback, not a sales pitch.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/custom-development" size="lg">
                Start a project
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary" size="lg">
                Just say hello
              </ButtonLink>
            </div>
            <p className="mt-7 font-mono text-[0.72rem] text-faint">
              Preferred: {settings.preferredProjects.join(' · ')}
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
