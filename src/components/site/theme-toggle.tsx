'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dark-first theme toggle; persists to localStorage, no flash on load
 * (an inline script applies the stored class before first paint).
 * State is read straight from the <html> class via useSyncExternalStore.
 */

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains('light');
}

function getServerSnapshot(): boolean {
  return false; // dark is the default
}

export function ThemeToggle({ className }: { className?: string }) {
  const isLight = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('light');
    document.documentElement.classList.toggle('light', next);
    try {
      localStorage.setItem('theme', next ? 'light' : 'dark');
    } catch {
      // Storage unavailable (private mode) — theme still toggles for the session.
    }
    listeners.forEach((callback) => callback());
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
