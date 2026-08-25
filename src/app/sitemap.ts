import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { publishedPostWhere } from '@/lib/content';
import { siteUrl } from '@/config/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/services`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/custom-development`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/contact`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const [projects, posts] = await Promise.all([
    db.project
      .findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => []),
    db.blogPost
      .findMany({
        where: publishedPostWhere(),
        select: { slug: true, updatedAt: true },
      })
      .catch(() => []),
  ]);

  return [
    ...staticRoutes,
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
