'use client';

import { useCallback, useRef, type ReactNode, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Spotlight radius in px. */
  radius?: number;
}

/**
 * Card with a cursor-following radial highlight — the site's signature
 * mouse interaction. Pure CSS variables + one mousemove handler; inert on
 * touch devices and under prefers-reduced-motion (hover-only effect).
 */
export function SpotlightCard({ children, className, radius = 320 }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    element.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={cn('group/spot relative overflow-hidden', className)}
      style={{ '--spot-r': `${radius}px` } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(var(--spot-r) circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in srgb, var(--accent) 9%, transparent), transparent 65%)',
        }}
      />
      {children}
    </div>
  );
}
