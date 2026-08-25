import Link from 'next/link';
import { ArrowUp, Mail } from 'lucide-react';
import { mainNav } from '@/config/site';
import { getSettings } from '@/lib/settings';
import { AvailabilityDot } from '@/components/site/availability';
import { GithubIcon, LinkedinIcon } from '@/components/ui/social-icons';

const serviceLinks = [
  { label: 'Full Stack Development', href: '/services#full-stack' },
  { label: 'SaaS Development', href: '/services#saas' },
  { label: 'E-Commerce', href: '/services#ecommerce' },
  { label: 'CRM & Business Systems', href: '/services#crm' },
  { label: 'API Development', href: '/services#api' },
  { label: 'Performance & Infrastructure', href: '/services#infrastructure' },
];

export async function Footer() {
  const settings = await getSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-line">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_50%,transparent)] to-transparent" />
      <div className="shell grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        {/* Brand */}
        <div>
          <p className="font-mono text-sm font-bold text-ink">
            <span className="text-gradient">{'{'}W{'}'}</span> {settings.developerName}
          </p>
          <p className="mt-3.5 max-w-sm text-sm leading-relaxed text-muted">
            {settings.developerTitle} crafting fast, scalable web platforms — from multi-tenant SaaS
            to high-throughput APIs. Available for select freelance engagements.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={settings.socials.github ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <GithubIcon className="size-4.5" />
            </a>
            <a
              href={settings.socials.linkedin ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <LinkedinIcon className="size-4.5" />
            </a>
            <a
              href={`mailto:${settings.developerEmail}`}
              aria-label="Email"
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <Mail className="size-4.5" />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer">
          <p className="font-mono text-[0.7rem] tracking-[0.16em] text-faint uppercase">Explore</p>
          <ul className="mt-4 space-y-2.5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-muted transition-colors hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Services */}
        <nav aria-label="Services">
          <p className="font-mono text-[0.7rem] tracking-[0.16em] text-faint uppercase">Services</p>
          <ul className="mt-4 space-y-2.5">
            {serviceLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-muted transition-colors hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <p className="font-mono text-[0.7rem] tracking-[0.16em] text-faint uppercase">Get in touch</p>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>
              <a href={`mailto:${settings.developerEmail}`} className="text-ink transition-colors hover:text-accent">
                {settings.developerEmail}
              </a>
            </li>
            <li>{settings.location}</li>
            <li>{settings.timezone}</li>
            <li className="flex items-center gap-2 pt-1">
              <AvailabilityDot availability={settings.availability} />
              <span>{settings.availabilityNote}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-[0.8rem] text-faint">
            © {year} {settings.developerName}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <p className="hidden font-mono text-[0.72rem] text-faint md:block">
              Next.js · TypeScript · PostgreSQL · self-hosted
            </p>
            <a
              href="#top"
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-all hover:-translate-y-0.5 hover:border-line-strong hover:text-ink"
              aria-label="Back to top"
            >
              <ArrowUp className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
