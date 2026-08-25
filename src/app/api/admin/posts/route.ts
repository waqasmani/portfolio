import { z } from 'zod';
import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { postUpsertSchema } from '@/lib/schemas';
import { postDataFromInput } from '@/lib/admin-content';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling('admin/posts create', async (req: Request) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const parsed = postUpsertSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Please fix the highlighted fields.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const existing = await db.blogPost.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return jsonError(409, 'A post with this slug already exists.', {
      errors: { slug: ['Slug already in use'] },
    });
  }

  const post = await db.blogPost.create({
    data: {
      ...postDataFromInput(parsed.data),
      authorId: user.id,
      publishedAt: parsed.data.status === 'PUBLISHED' ? new Date() : null,
    },
  });
  return jsonOk({ id: post.id });
});
