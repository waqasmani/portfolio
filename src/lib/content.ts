import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db';
import type { Prisma } from '@/generated/prisma/client';

/**
 * Read-side data access for the public site. Everything is wrapped in React
 * cache() so layouts, pages, and metadata functions share one query per
 * request.
 */

/** A post is visible when published, or scheduled and its time has passed. */
export function publishedPostWhere(): Prisma.BlogPostWhereInput {
  return {
    OR: [
      { status: 'PUBLISHED' },
      { status: 'SCHEDULED', scheduledFor: { lte: new Date() } },
    ],
  };
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const getPublishedProjects = cache(async () => {
  return db.project.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: 'desc' }],
  });
});

export const getFeaturedProjects = cache(async (limit = 4) => {
  return db.project.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
    take: limit,
  });
});

export const getProjectBySlug = cache(async (slug: string) => {
  return db.project.findFirst({ where: { slug, status: 'PUBLISHED' } });
});

export const getAdjacentProjects = cache(async (sortOrder: number) => {
  const [previous, next] = await Promise.all([
    db.project.findFirst({
      where: { status: 'PUBLISHED', sortOrder: { lt: sortOrder } },
      orderBy: { sortOrder: 'desc' },
      select: { slug: true, title: true },
    }),
    db.project.findFirst({
      where: { status: 'PUBLISHED', sortOrder: { gt: sortOrder } },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, title: true },
    }),
  ]);
  return { previous, next };
});

export async function incrementProjectViews(id: string): Promise<void> {
  await db.project.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

const POST_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  tags: true,
  accent: true,
  featured: true,
  readingTime: true,
  views: true,
  publishedAt: true,
  scheduledFor: true,
} satisfies Prisma.BlogPostSelect;

export interface PostListParams {
  page?: number;
  perPage?: number;
  category?: string;
  tag?: string;
  query?: string;
}

export const getPublishedPosts = cache(async (params: PostListParams = {}) => {
  const { page = 1, perPage = 9, category, tag, query } = params;

  const where: Prisma.BlogPostWhereInput = {
    AND: [
      publishedPostWhere(),
      category ? { category } : {},
      tag ? { tags: { has: tag } } : {},
      query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { excerpt: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {},
    ],
  };

  const [posts, total] = await Promise.all([
    db.blogPost.findMany({
      where,
      select: POST_LIST_SELECT,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.blogPost.count({ where }),
  ]);

  return { posts, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
});

export const getFeaturedPost = cache(async () => {
  return db.blogPost.findFirst({
    where: { AND: [publishedPostWhere(), { featured: true }] },
    select: POST_LIST_SELECT,
    orderBy: { publishedAt: 'desc' },
  });
});

export const getPostBySlug = cache(async (slug: string) => {
  return db.blogPost.findFirst({
    where: { AND: [{ slug }, publishedPostWhere()] },
    include: { author: { select: { name: true } } },
  });
});

export const getRelatedPosts = cache(async (postId: string, category: string, tags: string[]) => {
  return db.blogPost.findMany({
    where: {
      AND: [
        publishedPostWhere(),
        { id: { not: postId } },
        { OR: [{ category }, { tags: { hasSome: tags } }] },
      ],
    },
    select: POST_LIST_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });
});

export const getBlogCategoryCounts = cache(async () => {
  const groups = await db.blogPost.groupBy({
    by: ['category'],
    where: publishedPostWhere(),
    _count: { _all: true },
  });
  return groups
    .map((group) => ({ category: group.category, count: group._count._all }))
    .sort((a, b) => b.count - a.count);
});

export async function incrementPostViews(id: string): Promise<void> {
  await db.blogPost.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export const getTestimonials = cache(async () => {
  return db.testimonial.findMany({
    where: { published: true },
    orderBy: { sortOrder: 'asc' },
  });
});
