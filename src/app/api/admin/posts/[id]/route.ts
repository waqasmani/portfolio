import { z } from 'zod';
import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { postUpsertSchema } from '@/lib/schemas';
import { postDataFromInput } from '@/lib/admin-content';

export const dynamic = 'force-dynamic';

export const PATCH = withErrorHandling('admin/posts update', async (
  req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  const parsed = postUpsertSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Please fix the highlighted fields.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const existing = await db.blogPost.findUnique({ where: { id } });
  if (!existing) return jsonError(404, 'Post not found');

  const slugClash = await db.blogPost.findFirst({
    where: { slug: parsed.data.slug, id: { not: id } },
    select: { id: true },
  });
  if (slugClash) {
    return jsonError(409, 'A post with this slug already exists.', {
      errors: { slug: ['Slug already in use'] },
    });
  }

  await db.blogPost.update({
    where: { id },
    data: {
      ...postDataFromInput(parsed.data),
      // First transition to PUBLISHED stamps the publication date.
      publishedAt:
        parsed.data.status === 'PUBLISHED'
          ? (existing.publishedAt ?? new Date())
          : existing.publishedAt,
    },
  });
  return jsonOk();
});

export const DELETE = withErrorHandling('admin/posts delete', async (
  _req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser('ADMIN');
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  await db.blogPost.delete({ where: { id } }).catch(() => null);
  return jsonOk();
});
