import type { Metadata } from 'next';
import {
  ArrowRight,
  ClipboardCheck,
  Compass,
  FileDown,
  GaugeCircle,
  NotebookPen,
  Terminal,
} from 'lucide-react';
import { developer, skillGroups, stats } from '@/config/site';
import { getSettings } from '@/lib/settings';
import { PageHeader } from '@/components/site/page-header';
import { Reveal } from '@/components/motion/reveal';
import { Counter } from '@/components/motion/counter';
import { SectionHeading } from '@/components/ui/section-heading';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { TechIcon } from '@/components/ui/tech-icon';
import { ButtonLink, buttonStyles } from '@/components/ui/button';
import { AvailabilityPill } from '@/components/site/availability';
import { ResumeButton } from '@/components/site/resume-button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About',
  description: `Who ${developer.name} is, how the studio works, and the experience behind ${developer.yearsOfExperience}+ years of shipping production web platforms.`,
  alternates: { canonical: '/about' },
};

const principles = [
  {
    icon: Compass,
    title: 'Scope honestly',
    text: 'Every engagement starts with the uncomfortable questions — what this really costs, what can be cut, and what "done" means. Surprises belong in week one, not week twelve.',
  },
  {
    icon: Terminal,
    title: 'Ship iteratively',
    text: 'Working software early and often. A deployed slice of the real product beats a month of invisible progress, and feedback loops beat guesswork every time.',
  },
  {
    icon: GaugeCircle,
    title: 'Measure everything',
    text: 'Performance budgets, conversion events, error rates — decisions get made on evidence. If a rebuild claims to be faster, there will be a number proving it.',
  },
  {
    icon: NotebookPen,
    title: 'Document as we go',
    text: 'Architecture decisions, runbooks, and onboarding docs ship with the code. The measure of our work is how well the next engineer sleeps.',
  },
];

const timeline = [
  {
    period: '2021 — Present',
    role: 'CustomerFlow, the studio',
    org: 'customerflow.work',
    text: 'Design, build, and operate production platforms end-to-end for clients in logistics, retail, education, and SaaS — from first architecture sketch to monitored deployment, under one accountable roof.',
  },
  {
    period: '2018 — 2021',
    role: 'Agency years',
    org: 'Digital product agency',
    text: 'Our founding engineers led four-person teams delivering client platforms — owning technical architecture, code review culture, and the deployment pipeline across a dozen concurrent projects.',
  },
  {
    period: '2016 — 2018',
    role: 'E-commerce roots',
    org: 'High-traffic storefront',
    text: 'Checkout, inventory, and fulfilment features shipped to a storefront where downtime had a price per minute — the discipline the studio was built on.',
  },
];

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        eyebrow="About"
        title={
          <>
            The studio behind <span className="text-gradient">the platforms</span>
          </>
        }
        description="A short, honest introduction — what we build, how we think about software, and why clients keep coming back."
      />

      {/* Profile + bio */}
      <section className="shell py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Portrait panel */}
          <Reveal>
            <div className="relative mx-auto max-w-sm lg:mx-0 lg:max-w-none">
              <div
                aria-hidden
                className="absolute -inset-4 rounded-[2rem] opacity-50 blur-2xl"
                style={{
                  background:
                    'radial-gradient(60% 60% at 50% 30%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 75%)',
                }}
              />
              <div className="noise relative overflow-hidden rounded-3xl border border-line-strong bg-bg-raised">
                <div className="bg-grid absolute inset-0" aria-hidden />
                <div className="relative flex aspect-[4/5] flex-col items-center justify-center p-8">
                  <span
                    className="flex size-36 items-center justify-center rounded-full text-5xl font-bold text-[#0b1020] shadow-[var(--glow-accent)]"
                    style={{ background: 'var(--gradient-brand)' }}
                    aria-label={`${settings.developerName} monogram`}
                  >
                    {developer.initials}
                  </span>
                  <p className="mt-6 text-xl font-semibold text-ink">{settings.developerName}</p>
                  <p className="mt-1 font-mono text-[0.78rem] text-muted">{settings.developerTitle}</p>
                  <div className="mt-5">
                    <AvailabilityPill availability={settings.availability} />
                  </div>
                </div>
                <div className="relative flex items-center justify-between border-t border-line px-5 py-3 font-mono text-[0.7rem] text-faint">
                  <span>{settings.location}</span>
                  <span>{settings.timezone}</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Bio */}
          <div>
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Full stack, full ownership
              </h2>
              <div className="mt-5 space-y-4 leading-relaxed text-muted">
                <p>
                  {settings.developerName} is a {settings.developerTitle.toLowerCase()} with{' '}
                  {developer.yearsOfExperience}+ years of experience taking web platforms from first
                  whiteboard sketch to monitored production. Our work spans the entire stack —
                  interfaces in React and Next.js, service layers in Node.js, data in PostgreSQL and
                  MariaDB, and the Linux servers underneath it all.
                </p>
                <p>
                  We specialize in <strong className="font-medium text-ink">business-critical platforms</strong>:
                  multi-tenant SaaS, e-commerce with custom checkout flows, CRMs shaped around how a
                  company actually operates, and APIs that hold up under real traffic. The common thread
                  is systems where correctness and speed are features, not nice-to-haves.
                </p>
                <p>
                  We work best with founders and teams who want an engineering partner — one that
                  pushes back on scope, proposes simpler paths, and takes responsibility for the result
                  in production, not just the pull request.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/contact">
                  Work with us
                  <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
                <ResumeButton
                  resumePath={settings.resumePath}
                  className={buttonStyles('secondary', 'md')}
                >
                  <FileDown className="size-4" aria-hidden />
                  Download Company Profile
                </ResumeButton>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Stats */}
        <dl className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={0.05 * index}>
              <div className="flex flex-col-reverse rounded-2xl border border-line bg-panel p-6 text-center">
                <dt className="mt-1.5 text-[0.82rem] text-muted">{stat.label}</dt>
                <dd className="text-4xl font-bold tracking-tight text-ink tabular-nums">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* Principles */}
      <section className="border-y border-line bg-bg-raised/40">
        <div className="shell py-20 md:py-28">
          <SectionHeading
            eyebrow="Approach"
            title="How we build software"
            description="Four principles that show up in every project, whether it's a weekend script or a year-long platform."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {principles.map((principle, index) => (
              <Reveal key={principle.title} delay={0.06 * index} className="h-full">
                <SpotlightCard className="card-lift h-full rounded-2xl border border-line bg-panel p-6">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-line bg-panel-strong">
                    <principle.icon className="size-5 text-accent" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-[1.02rem] font-semibold text-ink">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{principle.text}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="shell py-20 md:py-28">
        <SectionHeading eyebrow="Experience" title="The road here" />
        <ol className="relative ml-3 space-y-10 border-l border-line pl-8">
          {timeline.map((entry, index) => (
            <Reveal key={entry.period} as="li" delay={0.07 * index} className="relative">
              <span
                aria-hidden
                className="absolute top-1.5 -left-[2.42rem] flex size-3 items-center justify-center rounded-full border-2 border-accent bg-bg"
              />
              <p className="font-mono text-[0.72rem] tracking-[0.14em] text-accent uppercase">
                {entry.period}
              </p>
              <h3 className="mt-1.5 text-lg font-semibold text-ink">{entry.role}</h3>
              <p className="text-[0.85rem] text-faint">{entry.org}</p>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted">{entry.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Toolbox strip */}
      <section className="border-t border-line">
        <div className="shell py-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">Daily toolbox</h2>
            <ClipboardCheck className="size-5 text-faint" aria-hidden />
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {skillGroups
              .flatMap((group) => group.skills)
              .map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 text-[0.8rem] text-muted transition-colors hover:border-line-strong hover:text-ink"
                >
                  <TechIcon name={skill} className="size-4" />
                  {skill}
                </span>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
