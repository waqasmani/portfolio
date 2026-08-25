import { z } from 'zod';
import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { projectUpsertSchema } from '@/lib/schemas';
import { projectDataFromInput } from '@/lib/admin-content';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling('admin/projects create', async (req: Request) => {
  const user = await getApiUser('ADMIN');
  if (!user) return jsonError(401, 'Unauthorized');

  const parsed = projectUpsertSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Please fix the highlighted fields.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const existing = await db.project.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return jsonError(409, 'A project with this slug already exists.', {
      errors: { slug: ['Slug already in use'] },
    });
  }

  const project = await db.project.create({
    data: { ...projectDataFromInput(parsed.data), publishedAt: new Date() },
  });
  return jsonOk({ id: project.id });
});
