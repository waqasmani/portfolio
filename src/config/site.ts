/**
 * Central site configuration — the single source of truth for the studio's
 * brand identity and static site structure. Runtime-editable values
 * (availability, socials, SEO defaults…) are stored in the SiteSettings table
 * and merge over these defaults; see src/lib/settings.ts.
 *
 * To rebrand the site, edit this file and re-seed (or update values from the
 * admin dashboard at /admin/settings).
 */

export const developer = {
  name: 'CustomerFlow',
  firstName: 'CustomerFlow',
  initials: 'CF',
  title: 'Full Stack Development Studio',
  tagline: 'We build fast, scalable, and beautiful web applications.',
  bio: 'Full stack development studio with 8+ years of experience designing, building, and operating production web platforms — from multi-tenant SaaS and e-commerce to custom CRMs and high-throughput APIs.',
  email: 'hello@customerflow.work',
  location: 'Remote · Worldwide',
  timezone: 'UTC+5 (PKT)',
  yearsOfExperience: 8,
  resumePath: '/profile.pdf',
  domain: 'customerflow.work',
} as const;

export const socials = {
  github: 'https://github.com/waqasmani',
  linkedin: 'https://www.linkedin.com/company/customerflow',
  x: 'https://x.com/customerflow',
} as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';

export const siteMeta = {
  name: `${developer.name} — ${developer.title}`,
  shortName: developer.name,
  description:
    'CustomerFlow is a full stack development studio building fast, scalable, and beautiful web applications with Next.js, React, Node.js, TypeScript, and PostgreSQL. Available for SaaS, e-commerce, CRM, and API projects.',
  keywords: [
    'CustomerFlow',
    'Full Stack Development Studio',
    'Next.js Development',
    'React Development',
    'Node.js Development',
    'TypeScript',
    'PostgreSQL',
    'SaaS Development',
    'Web Application Development',
  ],
} as const;

export const mainNav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Projects', href: '/projects' },
  { label: 'Services', href: '/services' },
  { label: 'Blog', href: '/blog' },
  { label: 'Custom Development', href: '/custom-development' },
  { label: 'Contact', href: '/contact' },
] as const;

export const heroKeywords = [
  'Next.js',
  'React',
  'Node.js',
  'TypeScript',
  'PostgreSQL',
  'MariaDB',
  'Prisma',
  'Cloudflare',
] as const;

export const stats = [
  { value: 60, suffix: '+', label: 'Projects Completed' },
  { value: 8, suffix: '+', label: 'Years of Experience' },
  { value: 25, suffix: '+', label: 'Technologies Used' },
  { value: 40, suffix: '+', label: 'Happy Clients' },
] as const;

/** Project category metadata shared by filters, badges, forms, and the admin. */
export const projectCategories = [
  { value: 'WEB_APP', label: 'Web Applications' },
  { value: 'SAAS', label: 'SaaS' },
  { value: 'ECOMMERCE', label: 'E-Commerce' },
  { value: 'CRM', label: 'CRM' },
  { value: 'API', label: 'API' },
  { value: 'OPEN_SOURCE', label: 'Open Source' },
] as const;

export type ProjectCategoryValue = (typeof projectCategories)[number]['value'];

export function projectCategoryLabel(value: string): string {
  return projectCategories.find((c) => c.value === value)?.label ?? value;
}

export const blogCategories = [
  'Web Development',
  'Next.js',
  'React',
  'Node.js',
  'DevOps',
  'Databases',
  'Tutorials',
  'AI Development',
] as const;

export const requestCategories = [
  'Custom Script',
  'Automation Tool',
  'Web Application',
  'API Development',
  'Website Feature',
  'Bug Fix',
  'Database Solution',
  'Server & Deployment',
] as const;

export const budgetRanges = [
  'Under $500',
  '$500 – $2,000',
  '$2,000 – $5,000',
  '$5,000 – $10,000',
  '$10,000 – $25,000',
  '$25,000+',
  'Not sure yet',
] as const;

export const contactProjectTypes = [
  'New Web Application',
  'SaaS Platform',
  'E-Commerce Store',
  'CRM / Business System',
  'API / Backend',
  'Performance & Infrastructure',
  'Consulting',
  'Something else',
] as const;

/** Skill matrix rendered on the home page and about page. */
export const skillGroups = [
  {
    key: 'frontend',
    label: 'Frontend',
    blurb: 'Interfaces that feel instant, look premium, and score green on Lighthouse.',
    skills: ['Next.js', 'React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Vue.js'],
  },
  {
    key: 'backend',
    label: 'Backend',
    blurb: 'Robust service layers with clean contracts, auth, and real-time transport.',
    skills: ['Node.js', 'Express', 'Fastify', 'REST APIs', 'Authentication', 'WebSockets'],
  },
  {
    key: 'database',
    label: 'Database',
    blurb: 'Schema design, query tuning, and data layers that stay fast at scale.',
    skills: ['PostgreSQL', 'MariaDB', 'MySQL', 'Prisma', 'Redis'],
  },
  {
    key: 'devops',
    label: 'Cloud & DevOps',
    blurb: 'From bare Linux boxes to global edge — shipped, monitored, and secured.',
    skills: ['Linux', 'Ubuntu', 'Docker', 'Nginx', 'Cloudflare', 'Cloudflare R2', 'GitHub Actions', 'PM2'],
  },
] as const;

export const marqueeTech = [
  'Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma',
  'Tailwind CSS', 'Docker', 'Nginx', 'Cloudflare', 'Redis', 'MariaDB',
  'Fastify', 'GitHub Actions', 'Linux', 'WebSockets', 'Vue.js', 'PM2',
] as const;

/** Runtime-editable settings: defaults merged under the SiteSettings DB row. */
export interface SiteSettingsData {
  availability: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
  availabilityNote: string;
  nextAvailableDate: string;
  preferredProjects: string[];
  responseTime: string;
  chatOnline: boolean;
  chatOfflineMessage: string;
  developerName: string;
  developerTitle: string;
  developerEmail: string;
  location: string;
  timezone: string;
  resumePath: string;
  socials: Record<string, string>;
  seoTitle: string;
  seoDescription: string;
}

export const defaultSettings: SiteSettingsData = {
  availability: 'AVAILABLE',
  availabilityNote: 'Currently taking on new client projects.',
  nextAvailableDate: 'March 2026',
  preferredProjects: ['SaaS platforms', 'E-commerce builds', 'API & backend systems'],
  responseTime: 'Within 24 hours',
  chatOnline: true,
  chatOfflineMessage:
    "The team is away right now — leave a message and we'll get back to you within 24 hours.",
  developerName: developer.name,
  developerTitle: developer.title,
  developerEmail: developer.email,
  location: developer.location,
  timezone: developer.timezone,
  resumePath: developer.resumePath,
  socials: { ...socials },
  seoTitle: siteMeta.name,
  seoDescription: siteMeta.description,
};
