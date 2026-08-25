'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface RotatingTextProps {
  words: readonly string[];
  intervalMs?: number;
  className?: string;
}

/** Cycles through keywords with a smooth vertical swap. */
export function RotatingText({ words, intervalMs = 2200, className }: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % words.length), intervalMs);
    return () => clearInterval(timer);
  }, [words.length, intervalMs, reduceMotion]);

  return (
    <span className={className} aria-live="off">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index]}
          initial={{ y: 14, opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -14, opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
