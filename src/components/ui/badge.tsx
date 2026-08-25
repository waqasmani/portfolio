import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeTone = 'neutral' | 'accent' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';

const tones: Record<BadgeTone, string> = {
  neutral: 'border-line text-muted bg-panel',
  accent:
    'border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]',
  emerald:
    'border-[color-mix(in_srgb,var(--emerald)_35%,transparent)] text-emerald bg-[color-mix(in_srgb,var(--emerald)_10%,transparent)]',
  amber:
    'border-[color-mix(in_srgb,var(--amber)_35%,transparent)] text-amber bg-[color-mix(in_srgb,var(--amber)_10%,transparent)]',
  rose: 'border-[color-mix(in_srgb,var(--rose)_35%,transparent)] text-rose bg-[color-mix(in_srgb,var(--rose)_10%,transparent)]',
  sky: 'border-[color-mix(in_srgb,var(--sky)_35%,transparent)] text-sky bg-[color-mix(in_srgb,var(--sky)_10%,transparent)]',
  violet:
    'border-[color-mix(in_srgb,var(--violet)_35%,transparent)] text-violet bg-[color-mix(in_srgb,var(--violet)_10%,transparent)]',
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium tracking-wide',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Small monospace chip used for technology names. */
export function TechChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[0.7rem] text-muted transition-colors hover:border-line-strong hover:text-ink',
        className
      )}
    >
      {children}
    </span>
  );
}

const statusTones: Record<string, BadgeTone> = {
  // Inquiry pipeline
  NEW: 'accent',
  REVIEWING: 'sky',
  CONTACTED: 'violet',
  PROPOSAL_SENT: 'amber',
  IN_PROGRESS: 'emerald',
  COMPLETED: 'emerald',
  REJECTED: 'rose',
  // Content
  DRAFT: 'neutral',
  PUBLISHED: 'emerald',
  SCHEDULED: 'amber',
  ARCHIVED: 'neutral',
  // Messages
  READ: 'sky',
  REPLIED: 'emerald',
  // Chat
  OPEN: 'accent',
  ASSIGNED: 'amber',
  CLOSED: 'neutral',
  // Priority
  LOW: 'neutral',
  NORMAL: 'sky',
  HIGH: 'amber',
  URGENT: 'rose',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge tone={statusTones[status] ?? 'neutral'} className={className}>
      {label}
    </Badge>
  );
}
