import { z } from 'zod';
import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { testimonialUpsertSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling('admin/testimonials create', async (req: Request) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const parsed = testimonialUpsertSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Please fix the highlighted fields.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const testimonial = await db.testimonial.create({
    data: { ...parsed.data, projectName: parsed.data.projectName || null },
  });
  return jsonOk({ id: testimonial.id });
});
