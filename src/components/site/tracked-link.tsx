'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { trackEvent, type ConversionEvent } from '@/lib/track-client';

interface TrackedExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  event: ConversionEvent;
  children: ReactNode;
}

/** External link that records a conversion event on click. */
export function TrackedExternalLink({ href, event, children, ...props }: TrackedExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(event)}
      {...props}
    >
      {children}
    </a>
  );
}
