import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion/reveal';

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

/** The recurring section header: mono eyebrow, display title, lede. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        'mb-12 max-w-2xl md:mb-16',
        align === 'center' && 'mx-auto text-center [&_.eyebrow]:justify-center',
        className
      )}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3.5 text-3xl font-semibold tracking-[-0.03em] text-balance text-ink sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">{description}</p>
      ) : null}
    </Reveal>
  );
}
