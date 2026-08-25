'use client';

import type { ReactNode } from 'react';
import { trackEvent } from '@/lib/track-client';

interface ResumeButtonProps {
  resumePath: string;
  className?: string;
  children: ReactNode;
}

/** Resume download link that records the conversion event. */
export function ResumeButton({ resumePath, className, children }: ResumeButtonProps) {
  return (
    <a
      href={resumePath}
      download
      className={className}
      onClick={() => trackEvent('resume_downloaded')}
    >
      {children}
    </a>
  );
}
