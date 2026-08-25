import type { ReactNode } from 'react';
import { Navbar } from '@/components/site/navbar';
import { Footer } from '@/components/site/footer';
import { AnalyticsBeacon } from '@/components/site/analytics-beacon';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div id="top" className="flex min-h-dvh flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
      <AnalyticsBeacon />
    </div>
  );
}
