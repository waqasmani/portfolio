import type { Metadata } from 'next';
import {
  Bot,
  Bug,
  Cloud,
  Code2,
  Database,
  FileCode2,
  Globe,
  ShieldCheck,
  Sparkles,
  Timer,
  Workflow,
} from 'lucide-react';
import { requestCategories } from '@/config/site';
import { getSettings } from '@/lib/settings';
import { PageHeader } from '@/components/site/page-header';
import { RequestForm } from '@/components/request/request-form';
import { Reveal } from '@/components/motion/reveal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Custom Development',
  description:
    'Request custom scripts, automation tools, web applications, APIs, bug fixes, and server work. The AI assistant turns your rough idea into a structured project brief before you submit.',
  alternates: { canonical: '/custom-development' },
};

const requestTypes = [
  { icon: FileCode2, label: 'Custom scripts' },
  { icon: Workflow, label: 'Automation tools' },
  { icon: Globe, label: 'Web applications' },
  { icon: Code2, label: 'APIs & integrations' },
  { icon: Sparkles, label: 'Website features' },
  { icon: Bug, label: 'Bug fixes' },
  { icon: Database, label: 'Database solutions' },
  { icon: Cloud, label: 'Server & deployment' },
];

export default async function CustomDevelopmentPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [params, settings] = await Promise.all([searchParams, getSettings()]);
  const initialCategory = requestCategories.includes(
    params.category as (typeof requestCategories)[number]
  )
    ? (params.category as (typeof requestCategories)[number])
    : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Custom Development"
        title={
          <>
            From rough idea to <span className="text-gradient">shipped software</span>
          </>
        }
        description="Describe what you need — a script, an app, an API, a fix — and it lands directly in my review queue. The optional AI assistant helps turn your idea into a structured brief first, so we start the conversation two steps ahead."
      >
        <ul className="mt-8 flex flex-wrap gap-2">
          {requestTypes.map((type) => (
            <li
              key={type.label}
              className="flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 text-[0.8rem] text-muted"
            >
              <type.icon className="size-3.5 text-accent" aria-hidden />
              {type.label}
            </li>
          ))}
        </ul>
      </PageHeader>

      <section className="shell py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <Reveal>
            <RequestForm initialCategory={initialCategory} />
          </Reveal>

          {/* Sidebar */}
          <Reveal delay={0.1} className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-line bg-panel p-6">
              <h2 className="flex items-center gap-2.5 font-semibold text-ink">
                <Bot className="size-5 text-accent" aria-hidden />
                How the AI assistant helps
              </h2>
              <ol className="mt-4 space-y-3.5 text-sm leading-relaxed text-muted">
                <li className="flex gap-3">
                  <span className="font-mono text-[0.75rem] font-bold text-accent">01</span>
                  Describe your idea in plain language — three sentences is enough.
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[0.75rem] font-bold text-accent">02</span>
                  It drafts requirements, features, a suggested stack, complexity, and delivery
                  phases.
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[0.75rem] font-bold text-accent">03</span>
                  Review the brief, attach it to your request, and we start the scoping call two
                  steps ahead.
                </li>
              </ol>
              <p className="mt-4 border-t border-line pt-4 text-[0.78rem] leading-relaxed text-faint">
                The assistant never quotes prices or timelines — that part stays human. Your idea is
                processed to generate the brief and never used for anything else.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-panel p-6">
              <h2 className="flex items-center gap-2.5 font-semibold text-ink">
                <ShieldCheck className="size-5 text-emerald" aria-hidden />
                What happens after you submit
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li className="flex items-start gap-2.5">
                  <Timer className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
                  Personal reply {settings.responseTime.toLowerCase()} — usually with clarifying
                  questions.
                </li>
                <li className="flex items-start gap-2.5">
                  <FileCode2 className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />A written
                  proposal with fixed milestones — you know the number before work starts.
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
                  Everything you share stays confidential, with an NDA on request.
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
