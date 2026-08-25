import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { buttonStyles } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[0.78rem] tracking-[0.2em] text-accent uppercase">404 — Not Found</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
        Lost in the <span className="text-gradient">void</span>
      </h1>
      <p className="mt-4 max-w-md text-muted">
        This page doesn&apos;t exist — it may have been moved, renamed, or never deployed in the first
        place.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={buttonStyles('primary', 'md')}>
          <ArrowLeft className="size-4" aria-hidden />
          Back home
        </Link>
        <Link href="/projects" className={buttonStyles('secondary', 'md')}>
          <Compass className="size-4" aria-hidden />
          Browse projects
        </Link>
      </div>
    </div>
  );
}
