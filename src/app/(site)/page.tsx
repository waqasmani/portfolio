import { getFeaturedProjects, getTestimonials } from '@/lib/content';
import { getSettings } from '@/lib/settings';
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
