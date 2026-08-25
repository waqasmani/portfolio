'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * The hero's animated "editor" visual: a syntax-colored API route that types
 * itself in line by line, with a live status bar. Tokens are hand-colored
 * spans — no highlighter ships to the client.
 */

type Token = [color: 'kw' | 'fn' | 'str' | 'type' | 'punc' | 'var' | 'com' | 'num', text: string];

const tokenColors: Record<Token[0], string> = {
  kw: 'text-violet',
  fn: 'text-sky',
  str: 'text-emerald',
  type: 'text-amber',
  punc: 'text-faint',
  var: 'text-ink',
  com: 'text-faint italic',
  num: 'text-rose',
};

const lines: Token[][] = [
  [['com', '// api/projects/route.ts']],
  [
    ['kw', 'export'], ['var', ' '], ['kw', 'async'], ['var', ' '], ['kw', 'function'],
    ['fn', ' GET'], ['punc', '('], ['var', 'req'], ['punc', ': '], ['type', 'Request'], ['punc', ') {'],
  ],
  [
    ['var', '  '], ['kw', 'const'], ['var', ' query '], ['punc', '= '], ['var', 'schema'],
    ['punc', '.'], ['fn', 'parse'], ['punc', '('], ['fn', 'params'], ['punc', '('], ['var', 'req'], ['punc', '));'],
  ],
  [
    ['var', '  '], ['kw', 'const'], ['var', ' projects '], ['punc', '= '], ['kw', 'await'],
    ['var', ' db'], ['punc', '.'], ['var', 'project'], ['punc', '.'], ['fn', 'findMany'], ['punc', '({'],
  ],
  [
    ['var', '    where'], ['punc', ': { '], ['var', 'status'], ['punc', ': '],
    ['str', "'PUBLISHED'"], ['punc', ' },'],
  ],
  [
    ['var', '    orderBy'], ['punc', ': { '], ['var', 'featured'], ['punc', ': '],
    ['str', "'desc'"], ['punc', ' },'],
  ],
  [['var', '  '], ['punc', '});']],
  [
    ['var', '  '], ['kw', 'return'], ['var', ' '], ['type', 'Response'], ['punc', '.'],
    ['fn', 'json'], ['punc', '({ '], ['var', 'ok'], ['punc', ': '], ['kw', 'true'],
    ['punc', ', '], ['var', 'projects'], ['punc', ' });'],
  ],
  [['punc', '}']],
];

export function CodePanel({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('relative', className)}>
      {/* Glow behind the panel */}
      <div
        aria-hidden
        className="absolute -inset-8 rounded-[2rem] opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(45% 45% at 60% 35%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 70%), radial-gradient(40% 40% at 30% 75%, color-mix(in srgb, var(--sky) 20%, transparent), transparent 70%)',
        }}
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative overflow-hidden rounded-2xl border border-line-strong bg-bg-raised/90 shadow-[var(--shadow-soft)] backdrop-blur-sm"
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="size-2.5 rounded-full bg-rose/80" />
          <span className="size-2.5 rounded-full bg-amber/80" />
          <span className="size-2.5 rounded-full bg-emerald/80" />
          <span className="ml-3 font-mono text-[0.72rem] text-faint">route.ts — customerflow-api</span>
          <span className="ml-auto rounded-md border border-line bg-panel px-1.5 py-0.5 font-mono text-[0.62rem] tracking-wide text-emerald">
            TS
          </span>
        </div>

        {/* Code */}
        <div className="overflow-x-auto p-4 font-mono text-[0.76rem] leading-[1.75] sm:text-[0.8rem]">
          <ol>
            {lines.map((line, lineIndex) => (
              <motion.li
                key={lineIndex}
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + lineIndex * 0.14, duration: 0.3 }}
                className="flex whitespace-pre"
              >
                <span className="mr-4 w-4 shrink-0 text-right text-faint/60 select-none">
                  {lineIndex + 1}
                </span>
                <span>
                  {line.map(([color, text], tokenIndex) => (
                    <span key={tokenIndex} className={tokenColors[color]}>
                      {text}
                    </span>
                  ))}
                  {lineIndex === lines.length - 1 && (
                    <span className="ml-0.5 inline-block h-[1.1em] w-[7px] translate-y-[3px] animate-blink bg-accent" />
                  )}
                </span>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 border-t border-line px-4 py-2.5 font-mono text-[0.68rem] text-faint">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald" />
            production
          </span>
          <span className="hidden sm:inline">response 42ms</span>
          <span className="ml-auto flex items-center gap-1.5 text-emerald">
            <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden>
              <path d="M2 6.5 5 9l5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            all checks passing
          </span>
        </div>
      </motion.div>

      {/* Floating metric chips */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="absolute -left-4 -bottom-9 hidden items-center gap-2 rounded-xl border border-line bg-bg-raised/95 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:flex"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--emerald)_14%,transparent)] font-mono text-[0.7rem] font-bold text-emerald">
          99
        </span>
        <div className="leading-tight">
          <p className="text-[0.72rem] font-semibold text-ink">Lighthouse</p>
          <p className="text-[0.62rem] text-faint">performance</p>
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.85, duration: 0.5 }}
        className="absolute -top-5 -right-2 hidden items-center gap-2 rounded-xl border border-line bg-bg-raised/95 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur-sm md:flex"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" style={{ animationDuration: '2s' }} />
          <span className="relative inline-flex size-2 rounded-full bg-emerald" />
        </span>
        <p className="font-mono text-[0.68rem] text-muted">uptime 99.98%</p>
      </motion.div>
    </div>
  );
}
