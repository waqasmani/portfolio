'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import type { Testimonial } from '@/generated/prisma/client';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * Testimonial carousel: one featured card with slide transitions, autoplay
 * that pauses on hover/focus, swipe support via framer drag, and dot + arrow
 * navigation. Falls back to a static card under prefers-reduced-motion.
 */
export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [[index, direction], setIndex] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const count = testimonials.length;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (delta: number) => {
      setIndex(([current]) => [(current + delta + count) % count, delta]);
    },
    [count]
  );

  useEffect(() => {
    if (paused || reduceMotion || count < 2) return;
    timer.current = setInterval(() => go(1), 6500);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, reduceMotion, go, count]);

  const testimonial = testimonials[index];

  return (
    <div
      className="relative mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.figure
            key={testimonial.id}
            custom={direction}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction >= 0 ? 80 : -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction >= 0 ? -80 : 80 }}
            transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            drag={reduceMotion || count < 2 ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) go(1);
              else if (info.offset.x > 70) go(-1);
            }}
            className="relative cursor-grab rounded-3xl border border-line bg-panel p-8 active:cursor-grabbing sm:p-10"
          >
            <Quote className="absolute top-7 right-8 size-8 text-accent opacity-25" aria-hidden />
            <blockquote className="relative text-[1.05rem] leading-relaxed text-ink sm:text-lg">
              “{testimonial.quote}”
            </blockquote>
            <figcaption className="mt-7 flex items-center gap-4">
              <Avatar name={testimonial.name} seed={testimonial.avatarSeed} className="size-12 text-sm" />
              <div className="min-w-0">
                <p className="font-semibold text-ink">{testimonial.name}</p>
                <p className="truncate text-[0.82rem] text-muted">
                  {testimonial.role}, {testimonial.company}
                </p>
              </div>
              {testimonial.projectName && (
                <span className="ml-auto hidden rounded-full border border-line bg-panel px-3 py-1 font-mono text-[0.7rem] text-faint sm:block">
                  {testimonial.projectName}
                </span>
              )}
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="mt-7 flex items-center justify-center gap-5">
          <button
            onClick={() => go(-1)}
            aria-label="Previous testimonial"
            className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            <ChevronLeft className="size-4.5" />
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Testimonials">
            {testimonials.map((item, dotIndex) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`Testimonial from ${item.name}`}
                onClick={() => setIndex([dotIndex, dotIndex > index ? 1 : -1])}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  dotIndex === index ? 'w-6 bg-accent' : 'w-1.5 bg-line-strong hover:bg-faint'
                )}
              />
            ))}
          </div>
          <button
            onClick={() => go(1)}
            aria-label="Next testimonial"
            className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            <ChevronRight className="size-4.5" />
          </button>
        </div>
      )}
    </div>
  );
}
