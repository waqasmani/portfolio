import { z } from 'zod';
import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { projectUpsertSchema } from '@/lib/schemas';
import { projectDataFromInput } from '@/lib/admin-content';

export const dynamic = 'force-dynamic';

export const PATCH = withErrorHandling('admin/projects update', async (
  req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser('ADMIN');
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  const parsed = projectUpsertSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Please fix the highlighted fields.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const existing = await db.project.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return jsonError(404, 'Project not found');

  const slugClash = await db.project.findFirst({
    where: { slug: parsed.data.slug, id: { not: id } },
    select: { id: true },
  });
  if (slugClash) {
    return jsonError(409, 'A project with this slug already exists.', {
      errors: { slug: ['Slug already in use'] },
    });
  }

  await db.project.update({ where: { id }, data: projectDataFromInput(parsed.data) });
  return jsonOk();
});

export const DELETE = withErrorHandling('admin/projects delete', async (
  _req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser('ADMIN');
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  await db.project.delete({ where: { id } }).catch(() => null);
  return jsonOk();
});
