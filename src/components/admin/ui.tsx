import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

export function AdminPageTitle({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  /** Percentage change vs previous period; omit to hide. */
  delta?: number | null;
  hint?: string;
}) {
  const showDelta = typeof delta === 'number' && Number.isFinite(delta);
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-[0.78rem] font-medium text-muted">{label}</p>
        <Icon className="size-4.5 text-faint" aria-hidden />
      </div>
      <p className="mt-2.5 text-3xl font-bold tracking-tight text-ink tabular-nums">
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      <div className="mt-1.5 flex items-center gap-2 text-[0.72rem]">
        {showDelta && (
          <span className={cn('flex items-center gap-1 font-medium', positive ? 'text-emerald' : 'text-rose')}>
            {positive ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
            {positive ? '+' : ''}
            {delta!.toFixed(0)}%
          </span>
        )}
        {hint && <span className="text-faint">{hint}</span>}
      </div>
    </div>
  );
}

export function AdminPanel({
  title,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-line bg-panel', className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-[0.9rem] font-semibold text-ink">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className={cn(padded && 'p-5')}>{children}</div>
    </section>
  );
}
