import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { messageStatusSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

/** Admin: update a contact message's status. */
export const PATCH = withErrorHandling('admin/messages', async (
  req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  const parsed = messageStatusSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(422, 'Invalid payload');

  const existing = await db.contactMessage.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return jsonError(404, 'Message not found');

  await db.contactMessage.update({ where: { id }, data: { status: parsed.data.status } });
  return jsonOk();
});

export const DELETE = withErrorHandling('admin/messages delete', async (
  _req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser('ADMIN');
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  await db.contactMessage.delete({ where: { id } }).catch(() => null);
  return jsonOk();
});
