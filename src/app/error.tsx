'use client';

import { useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in the browser console for debugging; server logs capture the rest.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[0.78rem] tracking-[0.2em] text-rose uppercase">Something broke</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        An unexpected error occurred
      </h1>
      <p className="mt-4 max-w-md text-muted">
        The error has been logged. Try again — if it keeps happening, reach out and mention code{' '}
        <code className="rounded bg-panel-strong px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
          {error.digest ?? 'unknown'}
        </code>
        .
      </p>
      <Button onClick={reset} className="mt-8">
        <RefreshCcw className="size-4" aria-hidden />
        Try again
      </Button>
    </div>
  );
}
