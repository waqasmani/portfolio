import type { ReactNode } from 'react';
import { Navbar } from '@/components/site/navbar';
import { Footer } from '@/components/site/footer';
import { AnalyticsBeacon } from '@/components/site/analytics-beacon';
import { ChatWidget } from '@/components/chat/chat-widget';
import { getSettings } from '@/lib/settings';
import { initials } from '@/lib/utils';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();

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
      <ChatWidget
        online={settings.chatOnline}
        responseTime={settings.responseTime}
        developerName={settings.developerName}
        initials={initials(settings.developerName)}
      />
      <AnalyticsBeacon />
    </div>
  );
}
