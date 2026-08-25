'use client';

import { CheckCircle2, Layers, ListChecks, Sparkles } from 'lucide-react';
import type { ProjectBrief } from '@/lib/schemas';
import { Badge, TechChip } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const complexityTone: Record<ProjectBrief['complexity'], { tone: string; width: string }> = {
  Simple: { tone: 'var(--emerald)', width: '25%' },
  Moderate: { tone: 'var(--sky)', width: '50%' },
  Complex: { tone: 'var(--amber)', width: '75%' },
  'Very Complex': { tone: 'var(--rose)', width: '100%' },
};

/** Renders the AI-generated project brief for review before submission. */
export function BriefView({ brief, className }: { brief: ProjectBrief; className?: string }) {
  const complexity = complexityTone[brief.complexity];

  return (
    <div className={cn('space-y-5', className)}>
      <p className="text-sm leading-relaxed text-muted">{brief.summary}</p>

      {/* Complexity */}
      <div className="rounded-xl border border-line bg-bg-raised p-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[0.68rem] tracking-[0.14em] text-faint uppercase">
            Estimated complexity
          </p>
          <span className="text-[0.85rem] font-semibold" style={{ color: complexity.tone }}>
            {brief.complexity}
          </span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-panel-strong">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: complexity.width, background: complexity.tone }}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Requirements */}
        <div>
          <h4 className="flex items-center gap-2 text-[0.82rem] font-semibold text-ink">
            <ListChecks className="size-4 text-accent" aria-hidden />
            Requirements
          </h4>
          <ul className="mt-2.5 space-y-2">
            {brief.requirements.map((requirement) => (
              <li key={requirement} className="flex items-start gap-2 text-[0.8rem] leading-snug text-muted">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald" aria-hidden />
                {requirement}
              </li>
            ))}
          </ul>
        </div>

        {/* Features */}
        <div>
          <h4 className="flex items-center gap-2 text-[0.82rem] font-semibold text-ink">
            <Sparkles className="size-4 text-accent" aria-hidden />
            Recommended features
          </h4>
          <ul className="mt-2.5 space-y-2">
            {brief.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-[0.8rem] leading-snug text-muted">
                <span className="mt-[0.42em] size-1.5 shrink-0 rounded-full bg-accent/70" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stack */}
      <div>
        <h4 className="flex items-center gap-2 text-[0.82rem] font-semibold text-ink">
          <Layers className="size-4 text-accent" aria-hidden />
          Suggested stack
        </h4>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {brief.stack.map((item) => (
            <span key={item.name} title={item.reason}>
              <TechChip className="cursor-help">{item.name}</TechChip>
            </span>
          ))}
        </div>
        <p className="mt-2 text-[0.72rem] text-faint">Hover a technology to see why it&apos;s suggested.</p>
      </div>

      {/* Phases */}
      <div>
        <h4 className="text-[0.82rem] font-semibold text-ink">Development phases</h4>
        <ol className="mt-3 space-y-0">
          {brief.phases.map((phase, index) => (
            <li key={phase.title} className="relative flex gap-3.5 pb-4 last:pb-0">
              {index < brief.phases.length - 1 && (
                <span className="absolute top-6 left-[0.72rem] h-[calc(100%-1.4rem)] w-px bg-line" aria-hidden />
              )}
              <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-bg-raised font-mono text-[0.62rem] font-bold text-accent">
                {index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[0.82rem] font-medium text-ink">{phase.title}</p>
                <p className="mt-0.5 text-[0.76rem] leading-relaxed text-muted">{phase.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-[0.72rem] text-faint">
        <Badge tone="neutral">No pricing</Badge>
        Cost and timeline are quoted personally after a scoping conversation — never by the
        assistant.
      </div>
    </div>
  );
}
