import { z } from 'zod';
import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { testimonialUpsertSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export const PATCH = withErrorHandling('admin/testimonials update', async (
  req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  const parsed = testimonialUpsertSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Please fix the highlighted fields.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const existing = await db.testimonial.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return jsonError(404, 'Testimonial not found');

  await db.testimonial.update({
    where: { id },
    data: { ...parsed.data, projectName: parsed.data.projectName || null },
  });
  return jsonOk();
});

export const DELETE = withErrorHandling('admin/testimonials delete', async (
  _req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser('ADMIN');
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  await db.testimonial.delete({ where: { id } }).catch(() => null);
  return jsonOk();
});
