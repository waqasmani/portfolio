import { siGithub, siX } from 'simple-icons';
import { cn } from '@/lib/utils';

/**
 * Social brand glyphs rendered in currentColor. GitHub/X come from
 * simple-icons; LinkedIn (no longer distributed there) is inlined.
 */

function BrandSvg({ path, className, title }: { path: string; className?: string; title: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5 fill-current', className)} role="img" aria-hidden>
      <title>{title}</title>
      <path d={path} />
    </svg>
  );
}

export function GithubIcon({ className }: { className?: string }) {
  return <BrandSvg path={siGithub.path} className={className} title="GitHub" />;
}

export function XIcon({ className }: { className?: string }) {
  return <BrandSvg path={siX.path} className={className} title="X" />;
}

const LINKEDIN_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

export function LinkedinIcon({ className }: { className?: string }) {
  return <BrandSvg path={LINKEDIN_PATH} className={className} title="LinkedIn" />;
}
