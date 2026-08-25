import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Blocks,
  Boxes,
  CheckCircle2,
  Gauge,
  Globe,
  Handshake,
  Lightbulb,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Workflow,
} from 'lucide-react';
import { siteUrl } from '@/config/site';
import { PageHeader } from '@/components/site/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { buttonStyles } from '@/components/ui/button';
import { Faq } from '@/components/site/faq';
import { JsonLd } from '@/components/site/json-ld';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Full stack development services: SaaS platforms, e-commerce, custom CRMs, API development, and performance & infrastructure work — scoped honestly and shipped to production.',
  alternates: { canonical: '/services' },
};

const services = [
  {
    id: 'full-stack',
    icon: Globe,
    title: 'Full Stack Web Development',
    description:
      'Modern, scalable web applications built end-to-end — from database schema to polished interface, with the deployment pipeline included.',
    features: [
      'Next.js + React frontends with premium UX',
      'Node.js service layers with typed contracts',
      'PostgreSQL / MariaDB schema design',
      'Authentication, roles & permissions',
      'Automated testing & CI from day one',
    ],
    cta: 'Plan your application',
  },
  {
    id: 'saas',
    icon: Boxes,
    title: 'SaaS Development',
    description:
      'Multi-tenant platforms with clean tenant isolation, billing, dashboards, and the operational tooling a real product company needs.',
    features: [
      'Multi-tenant architecture (RLS or schema-per-tenant)',
      'Subscription billing & usage metering',
      'Admin consoles & customer dashboards',
      'Real-time features via SSE / WebSockets',
      'Tenant onboarding & provisioning flows',
    ],
    cta: 'Scope your SaaS',
  },
  {
    id: 'ecommerce',
    icon: ShoppingCart,
    title: 'E-Commerce Development',
    description:
      'Custom storefronts and commerce platforms where speed is a sales feature — bespoke checkouts, configurators, and order operations.',
    features: [
      'Headless storefronts with sub-2s page loads',
      'Custom checkout & payment flows (Stripe)',
      'Product configurators & complex pricing',
      'Inventory & fulfilment integrations',
      'Structured data for rich search results',
    ],
    cta: 'Upgrade your store',
  },
  {
    id: 'crm',
    icon: Workflow,
    title: 'CRM & Business Systems',
    description:
      'Internal platforms shaped around how your company actually works — CRMs, ERPs, inventory, quoting engines, and management systems.',
    features: [
      'Domain modelling around your real workflow',
      'Pipelines, quoting & document generation',
      'Spreadsheet imports with validation',
      'Role-based access for teams',
      'Reports & dashboards leadership will use',
    ],
    cta: 'Replace the spreadsheets',
  },
  {
    id: 'api',
    icon: Blocks,
    title: 'API Development',
    description:
      'REST APIs and backend architecture with clean contracts, honest error handling, and the throughput characteristics your load actually needs.',
    features: [
      'REST design with typed, versioned contracts',
      'Rate limiting, quotas & API key management',
      'Webhook systems & third-party integrations',
      'High-throughput ingestion pipelines',
      'OpenAPI documentation your users can read',
    ],
    cta: 'Design your API',
  },
  {
    id: 'infrastructure',
    icon: Gauge,
    title: 'Performance & Infrastructure',
    description:
      'Server setup, deployment pipelines, and optimization work — Nginx, Docker, PM2, Cloudflare — that turns fragile hosting into boring, monitored infrastructure.',
    features: [
      'Zero-downtime deployment pipelines',
      'Nginx, Docker & PM2 production setups',
      'Core Web Vitals & database optimization',
      'Cloudflare edge caching & security',
      'Monitoring, alerting & backup strategy',
    ],
    cta: 'Stabilise your stack',
  },
];

const process = [
  {
    icon: Lightbulb,
    title: 'Discover',
    text: 'A working session on goals, constraints, and what "done" means. You get an honest scope — including what not to build.',
  },
  {
    icon: Handshake,
    title: 'Design',
    text: 'Architecture, data model, and milestone plan. Fixed expectations before the first commit, in writing.',
  },
  {
    icon: Rocket,
    title: 'Build',
    text: 'Weekly shippable increments on a staging URL you can click. Progress you can see, not status reports.',
  },
  {
    icon: ShieldCheck,
    title: 'Operate',
    text: 'Monitored launch, documentation, and a handover your team owns — with optional ongoing support.',
  },
];

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ProfessionalService',
          name: 'Full Stack Web Development Services',
          url: `${siteUrl}/services`,
          areaServed: 'Worldwide',
          makesOffer: services.map((service) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: service.title, description: service.description },
          })),
        }}
      />

      <PageHeader
        eyebrow="Services"
        title={
          <>
            Engineering that <span className="text-gradient">pays for itself</span>
          </>
        }
        description="Six ways I help companies ship. Every engagement is scoped honestly, built in shippable increments, and handed over with documentation — no black boxes."
      />

      {/* Service cards */}
      <section className="shell py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={Math.min(index, 3) * 0.06} className="h-full">
              <SpotlightCard
                className="card-lift flex h-full scroll-mt-24 flex-col rounded-2xl border border-line bg-panel p-7"
              >
                <div id={service.id} aria-hidden className="absolute -top-24" />
                <div className="flex size-12 items-center justify-center rounded-xl border border-line bg-panel-strong">
                  <service.icon className="size-5.5 text-accent" aria-hidden />
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink">{service.title}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{service.description}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-muted">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 border-t border-line pt-5">
                  <Link
                    href={`/custom-development?category=${encodeURIComponent(categoryFor(service.id))}`}
                    className="inline-flex items-center gap-2 text-[0.88rem] font-medium text-accent transition-colors hover:text-accent-strong"
                  >
                    {service.cta}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-line bg-bg-raised/40">
        <div className="shell py-16 md:py-24">
          <SectionHeading
            eyebrow="Process"
            title="From idea to operated"
            description="The same four-phase rhythm on every project — sized to fit a two-week script or a year-long platform."
          />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, index) => (
              <Reveal key={step.title} as="li" delay={0.07 * index} className="relative">
                <div className="h-full rounded-2xl border border-line bg-panel p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-panel-strong">
                      <step.icon className="size-4.5 text-accent" aria-hidden />
                    </span>
                    <span className="font-mono text-3xl font-bold text-line-strong">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-[0.84rem] leading-relaxed text-muted">{step.text}</p>
                </div>
                {index < process.length - 1 && (
                  <ArrowRight
                    className="absolute top-1/2 -right-4.5 z-10 hidden size-4 -translate-y-1/2 text-faint lg:block"
                    aria-hidden
                  />
                )}
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="shell py-16 md:py-24">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions clients actually ask"
          className="max-w-2xl"
        />
        <Faq
          items={[
            {
              question: 'How do engagements and pricing work?',
              answer:
                'Most projects run as fixed-scope milestones: we agree on deliverables and price per phase, and you only commit to the next phase once the current one ships. Ongoing work (support, iteration) runs on a monthly retainer. Either way, you always know the number before work starts.',
            },
            {
              question: 'Can you take over an existing codebase?',
              answer:
                'Yes — roughly half my work is inherited systems. Engagements start with a paid audit: I map the architecture, risks, and quick wins into a written report, so we both know what we’re dealing with before committing to a bigger plan.',
            },
            {
              question: 'Who owns the code and infrastructure?',
              answer:
                'You do, from the first commit. Everything lives in your GitHub organisation and your cloud accounts. I insist on this — vendor lock-in with a freelancer is a risk you should never accept.',
            },
            {
              question: 'What happens after launch?',
              answer:
                'Every project ships with documentation, monitoring, and a handover session. After that you can run it in-house, keep me on a light support retainer, or book iteration sprints as needs come up — no forced ongoing contract.',
            },
          ]}
        />
      </section>

      {/* CTA */}
      <section className="shell pb-20 md:pb-28">
        <Reveal>
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-panel px-6 py-12 text-center sm:px-12">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
              Not sure which service fits? Describe the problem — I&apos;ll suggest the smallest thing
              that solves it.
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/custom-development" className={buttonStyles('primary', 'lg')}>
                Request a project
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/contact" className={buttonStyles('secondary', 'lg')}>
                Ask a question first
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function categoryFor(serviceId: string): string {
  switch (serviceId) {
    case 'api':
      return 'API Development';
    case 'infrastructure':
      return 'Server & Deployment';
    default:
      return 'Web Application';
  }
}
