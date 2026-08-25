import { developer, siteMeta, siteUrl, skillGroups, socials } from '@/config/site';
import { getFeaturedProjects, getTestimonials } from '@/lib/content';
import { getSettings } from '@/lib/settings';
import { JsonLd } from '@/components/site/json-ld';
import { Hero } from '@/components/home/hero';
import {
  AboutPreview,
  CtaSection,
  FeaturedProjects,
  ServicesStrip,
  SkillsSection,
  TechMarquee,
  TestimonialsSection,
} from '@/components/home/sections';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [settings, projects, testimonials] = await Promise.all([
    getSettings(),
    getFeaturedProjects(4),
    getTestimonials(),
  ]);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${siteUrl}/#org`,
              name: settings.developerName,
              slogan: settings.developerTitle,
              email: `mailto:${settings.developerEmail}`,
              url: siteUrl,
              sameAs: Object.values(settings.socials ?? socials),
              knowsAbout: skillGroups.flatMap((group) => [...group.skills]),
              description: developer.bio,
            },
            {
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              url: siteUrl,
              name: siteMeta.shortName,
              description: settings.seoDescription,
              publisher: { '@id': `${siteUrl}/#org` },
            },
            {
              '@type': 'ProfessionalService',
              '@id': `${siteUrl}/#service`,
              name: `${settings.developerName} — ${settings.developerTitle}`,
              url: siteUrl,
              parentOrganization: { '@id': `${siteUrl}/#org` },
              areaServed: 'Worldwide',
              serviceType: [
                'Full Stack Web Development',
                'SaaS Development',
                'E-Commerce Development',
                'CRM & Business Systems',
                'API Development',
                'Performance & Infrastructure',
              ],
            },
          ],
        }}
      />
      <Hero
        availability={settings.availability}
        availabilityNote={settings.availabilityNote}
        resumePath={settings.resumePath}
      />
      <TechMarquee />
      <AboutPreview />
      <SkillsSection />
      <FeaturedProjects projects={projects} />
      <ServicesStrip />
      <TestimonialsSection testimonials={testimonials} />
      <CtaSection settings={settings} />
    </>
  );
}
