import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ToastProvider } from '@/components/ui/toast';
import { developer, siteMeta, siteUrl } from '@/config/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteMeta.name,
    template: `%s — ${developer.name}`,
  },
  description: siteMeta.description,
  keywords: [...siteMeta.keywords],
  authors: [{ name: developer.name, url: siteUrl }],
  creator: developer.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: siteMeta.shortName,
    title: siteMeta.name,
    description: siteMeta.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMeta.name,
    description: siteMeta.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#05070d' },
    { media: '(prefers-color-scheme: light)', color: '#f6f7fb' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/** Applies the stored theme before first paint — dark is the default. */
const themeScript = `(function(){try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
