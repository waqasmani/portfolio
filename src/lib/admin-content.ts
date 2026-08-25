import 'server-only';
import type { z } from 'zod';
import type { postUpsertSchema, projectUpsertSchema } from '@/lib/schemas';
import { estimateReadingTime } from '@/lib/markdown';
import type { Prisma } from '@/generated/prisma/client';

/** Map validated project form input onto Prisma create/update data. */
export function projectDataFromInput(input: z.infer<typeof projectUpsertSchema>) {
  return {
    slug: input.slug,
    title: input.title,
    tagline: input.tagline,
    description: input.description,
    category: input.category,
    clientType: input.clientType || null,
    year: input.year ?? null,
    featured: input.featured,
    sortOrder: input.sortOrder,
    status: input.status,
    accent: input.accent,
    problem: input.problem || null,
    solution: input.solution || null,
    challenges: input.challenges as unknown as Prisma.InputJsonValue,
    architecture: input.architecture as unknown as Prisma.InputJsonValue,
    results: input.results as unknown as Prisma.InputJsonValue,
    gallery: input.gallery as unknown as Prisma.InputJsonValue,
    stack: input.stack,
    liveUrl: input.liveUrl || null,
    githubUrl: input.githubUrl || null,
  };
}

/** Map validated blog post form input onto Prisma create/update data. */
export function postDataFromInput(input: z.infer<typeof postUpsertSchema>) {
  return {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    category: input.category,
    tags: input.tags,
    accent: input.accent,
    status: input.status,
    featured: input.featured,
    readingTime: estimateReadingTime(input.content),
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
    scheduledFor:
      input.status === 'SCHEDULED' && input.scheduledFor ? new Date(input.scheduledFor) : null,
  };
}
