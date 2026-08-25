import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Extra classes for the moving track (e.g. gap sizing). */
  trackClassName?: string;
}

/**
 * Infinite horizontal scroll strip. Content is duplicated once; the CSS
 * animation translates -50% for a seamless loop. Pauses on hover, and
 * prefers-reduced-motion collapses the animation globally.
 */
export function Marquee({ children, className, trackClassName }: MarqueeProps) {
  return (
    <div className={cn('marquee-mask overflow-hidden', className)}>
      <div className={cn('marquee-track flex items-center gap-10', trackClassName)}>
        <div className="flex shrink-0 items-center gap-10" aria-hidden={false}>
          {children}
        </div>
        <div className="flex shrink-0 items-center gap-10" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
