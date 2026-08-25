'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageview } from '@/lib/track-client';

/** Sends one pageview per route change. Admin routes are never tracked. */
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    // Only the landing pageview carries the external referrer.
    trackPageview(pathname, isFirst.current ? document.referrer : undefined);
    isFirst.current = false;
  }, [pathname]);

  return null;
}
