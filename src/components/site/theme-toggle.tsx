'use client';

import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Dark-first theme toggle; persists to localStorage, no flash on load. */
export function ThemeToggle({ className }: { className?: string }) {
  const [isLight, setIsLight] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains('light'));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('light');
    document.documentElement.classList.toggle('light', next);
    try {
      localStorage.setItem('theme', next ? 'light' : 'dark');
    } catch {
      // Storage unavailable (private mode) — theme still toggles for the session.
    }
    setIsLight(next);
  }, []);

  return (
    <button
      onClick={toggle}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink',
        className
      )}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <Sun
        className={cn(
          'absolute size-4.5 transition-all duration-300',
          isLight ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        )}
      />
      <Moon
        className={cn(
          'absolute size-4.5 transition-all duration-300',
          isLight ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'
        )}
      />
    </button>
  );
}
