import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { inquiryStatusSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

/** Admin: update a project request's pipeline status / internal notes. */
export const PATCH = withErrorHandling('admin/requests', async (
  req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser('ADMIN');
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  const parsed = inquiryStatusSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(422, 'Invalid payload');

  const existing = await db.projectRequest.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return jsonError(404, 'Request not found');

  const request = await db.projectRequest.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    },
  });

  return jsonOk({ status: request.status });
});

export const DELETE = withErrorHandling('admin/requests delete', async (
  _req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser('ADMIN');
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  await db.projectRequest.delete({ where: { id } }).catch(() => null);
  return jsonOk();
});
