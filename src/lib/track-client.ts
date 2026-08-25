'use client';

/**
 * Client-side analytics helpers. Fire-and-forget: failures are swallowed —
 * analytics must never affect UX.
 */

export type ConversionEvent =
  | 'contact_submitted'
  | 'project_request_submitted'
  | 'resume_downloaded'
  | 'chat_started'
  | 'demo_clicked'
  | 'github_clicked';

function send(body: Record<string, unknown>): void {
  try {
    const payload = JSON.stringify(body);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
      return;
    }
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function trackPageview(path: string, referrer?: string): void {
  send({ type: 'pageview', path, referrer: referrer || undefined });
}

export function trackEvent(name: ConversionEvent, path?: string): void {
  send({ type: 'event', name, path: path ?? window.location.pathname });
}
