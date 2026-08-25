'use client';

import { useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, FileDown, Mail, Sparkles } from 'lucide-react';
import { developer, heroKeywords, socials } from '@/config/site';
import { ButtonLink, buttonStyles } from '@/components/ui/button';
import { AvailabilityPill } from '@/components/site/availability';
import { RotatingText } from '@/components/home/rotating-text';
import { CodePanel } from '@/components/home/code-panel';
import { trackEvent } from '@/lib/track-client';
import { GithubIcon, LinkedinIcon } from '@/components/ui/social-icons';

interface HeroProps {
  availability: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
  availabilityNote: string;
  resumePath: string;
}

export function Hero({ availability, availabilityNote, resumePath }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Cursor-following ambient glow: writes CSS vars, GPU-cheap, hover-only.
  const onMouseMove = useCallback((event: React.MouseEvent) => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    section.style.setProperty('--hero-mx', `${event.clientX - rect.left}px`);
    section.style.setProperty('--hero-my', `${event.clientY - rect.top}px`);
  }, []);

  const fadeUp = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] as const },
        };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      className="noise relative isolate overflow-hidden"
      aria-label="Introduction"
    >
      {/* Layered background: grid, aurora fields, cursor glow */}
      <div aria-hidden className="bg-grid absolute inset-0 -z-20" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-80"
        style={{
          background:
            'radial-gradient(52% 42% at 18% 8%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 70%), radial-gradient(44% 38% at 85% 22%, color-mix(in srgb, var(--sky) 11%, transparent), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden lg:block"
        style={{
          background:
            'radial-gradient(520px circle at var(--hero-mx, 50%) var(--hero-my, 35%), color-mix(in srgb, var(--accent) 7%, transparent), transparent 72%)',
        }}
      />

      <div className="shell grid min-h-[calc(100dvh-4rem)] items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-10">
        {/* Copy */}
        <div className="max-w-xl lg:max-w-none">
          <motion.div {...fadeUp(0)}>
            <AvailabilityPill availability={availability} label={availabilityNote} />
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className="mt-6 text-[2.7rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-6xl xl:text-[4.2rem]"
          >
            {developer.firstName} builds{' '}
            <span className="text-gradient">fast, scalable</span> &amp; beautiful web applications.
          </motion.h1>

          <motion.p {...fadeUp(0.16)} className="mt-5 flex flex-wrap items-baseline gap-x-2 text-lg text-muted">
            <span className="font-medium text-ink">{developer.title}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-baseline gap-2">
              shipping with
              <RotatingText
                words={heroKeywords}
                className="inline-block min-w-[7.5ch] font-mono text-[0.95em] font-semibold text-accent"
              />
            </span>
          </motion.p>

          <motion.p {...fadeUp(0.22)} className="mt-4 max-w-lg leading-relaxed text-muted">
            Eight years of turning ambitious ideas into production platforms — multi-tenant SaaS,
            e-commerce, custom CRMs, and APIs that stay fast under real traffic.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/projects" size="lg">
              View My Work
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/custom-development" variant="secondary" size="lg">
              <Sparkles className="size-4 text-accent" aria-hidden />
              Start a Project
            </ButtonLink>
            <a
              href={resumePath}
              download
              onClick={() => trackEvent('resume_downloaded')}
              className={buttonStyles('ghost', 'lg')}
            >
              <FileDown className="size-4" aria-hidden />
              Resume
            </a>
          </motion.div>

          <motion.div {...fadeUp(0.38)} className="mt-9 flex items-center gap-1.5">
            <span className="mr-2 font-mono text-[0.7rem] tracking-[0.14em] text-faint uppercase">
              Find me on
            </span>
            <a
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
              onClick={() => trackEvent('github_clicked')}
              className="flex size-9 items-center justify-center rounded-full text-muted transition-all hover:-translate-y-0.5 hover:text-ink"
            >
              <GithubIcon className="size-4.5" />
            </a>
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
              className="flex size-9 items-center justify-center rounded-full text-muted transition-all hover:-translate-y-0.5 hover:text-ink"
            >
              <LinkedinIcon className="size-4.5" />
            </a>
            <a
              href={`mailto:${developer.email}`}
              aria-label="Send an email"
              className="flex size-9 items-center justify-center rounded-full text-muted transition-all hover:-translate-y-0.5 hover:text-ink"
            >
              <Mail className="size-4.5" />
            </a>
          </motion.div>
        </div>

        {/* Visual */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none" style={{ perspective: '1200px' }}>
          <CodePanel />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#stack"
        aria-label="Scroll to content"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-faint transition-colors hover:text-muted lg:flex"
      >
        <span className="font-mono text-[0.65rem] tracking-[0.2em] uppercase">Scroll</span>
        <span className="flex h-9 w-5.5 items-start justify-center rounded-full border border-line-strong p-1">
          <motion.span
            aria-hidden
            className="size-1.5 rounded-full bg-accent"
            animate={reduceMotion ? undefined : { y: [0, 12, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
        <ArrowDown className="size-3.5" aria-hidden />
      </motion.a>
    </section>
  );
}
