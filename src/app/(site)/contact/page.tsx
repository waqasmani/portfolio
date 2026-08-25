import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Clock3, Globe2, Mail, MessageSquareText, Timer } from 'lucide-react';
import { getSettings } from '@/lib/settings';
import { PageHeader } from '@/components/site/page-header';
import { ContactForm } from '@/components/site/contact-form';
import { Reveal } from '@/components/motion/reveal';
import { AvailabilityPill } from '@/components/site/availability';
import { GithubIcon, LinkedinIcon, XIcon } from '@/components/ui/social-icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch about a project, a question, or a collaboration. Serious inquiries get a reply within one business day.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const settings = await getSettings();

  const infoRows = [
    { icon: Mail, label: 'Email', value: settings.developerEmail, href: `mailto:${settings.developerEmail}` },
    { icon: Globe2, label: 'Location', value: settings.location },
    { icon: Clock3, label: 'Timezone', value: settings.timezone },
    { icon: Timer, label: 'Response time', value: settings.responseTime },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            Let&apos;s talk about <span className="text-gradient">your project</span>
          </>
        }
        description="Whether it's a fully-formed spec or three sentences and a deadline — send it over. Every serious message gets a thoughtful reply, not a canned pitch."
      />

      <section className="shell py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          {/* Info panel */}
          <Reveal className="space-y-6">
            <div className="rounded-2xl border border-line bg-panel p-6 sm:p-7">
              <AvailabilityPill availability={settings.availability} label={settings.availabilityNote} />
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Next opening: <span className="font-medium text-ink">{settings.nextAvailableDate}</span>.
                Preferred projects right now: {settings.preferredProjects.join(', ').toLowerCase()}.
              </p>

              <dl className="mt-6 space-y-4 border-t border-line pt-6">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-3.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-panel-strong">
                      <row.icon className="size-4 text-accent" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[0.7rem] tracking-wide text-faint uppercase">{row.label}</dt>
                      <dd className="truncate text-sm font-medium text-ink">
                        {row.href ? (
                          <a href={row.href} className="transition-colors hover:text-accent">
                            {row.value}
                          </a>
                        ) : (
                          row.value
                        )}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex items-center gap-2.5 border-t border-line pt-6">
                {settings.socials.github && (
                  <a
                    href={settings.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
                  >
                    <GithubIcon className="size-4.5" />
                  </a>
                )}
                {settings.socials.linkedin && (
                  <a
                    href={settings.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
                  >
                    <LinkedinIcon className="size-4.5" />
                  </a>
                )}
                {settings.socials.x && (
                  <a
                    href={settings.socials.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X"
                    className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
                  >
                    <XIcon className="size-4" />
                  </a>
                )}
              </div>
            </div>

            <Link
              href="/custom-development"
              className="group flex items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_11%,transparent)]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]">
                <MessageSquareText className="size-5 text-accent" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-ink">Have a defined project?</span>
                <span className="mt-0.5 block text-[0.82rem] text-muted">
                  Use the project request form — it captures scope, budget, and files, and the AI
                  assistant helps shape your brief.
                </span>
              </span>
              <ArrowUpRight
                className="size-5 shrink-0 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-ink">Send a message</h2>
              <p className="mt-1 mb-6 text-[0.85rem] text-muted">
                Fields marked <span className="text-rose">*</span> are required.
              </p>
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
