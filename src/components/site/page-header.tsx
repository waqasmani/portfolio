import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion/reveal';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Standard page opener: eyebrow, display title, lede, optional extras. */
export function PageHeader({ eyebrow, title, description, children, className }: PageHeaderProps) {
  return (
    <header className={cn('noise relative overflow-hidden border-b border-line', className)}>
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(55% 65% at 50% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 72%)',
        }}
      />
      <div className="shell relative py-16 md:py-24">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-balance text-ink sm:text-5xl md:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-muted">{description}</p>
          ) : null}
        </Reveal>
        {children ? <Reveal delay={0.1}>{children}</Reveal> : null}
      </div>
    </header>
  );
}
