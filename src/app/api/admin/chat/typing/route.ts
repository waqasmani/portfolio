import { z } from 'zod';
import { getApiUser } from '@/lib/auth';
import { enforceLimit, jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { chatBus } from '@/lib/chat-bus';

export const dynamic = 'force-dynamic';

const schema = z.object({ conversationId: z.string().min(8).max(64) });

/** Admin typing indicator. */
export const POST = withErrorHandling('admin/chat/typing', async (req: Request) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const limited = enforceLimit(req, `admin-typing:${user.id}`, { capacity: 20, refillPerSec: 1 });
  if (limited) return limited;

  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(422, 'Invalid payload');

  chatBus.publish(`conv:${parsed.data.conversationId}`, {
    kind: 'typing',
    payload: { conversationId: parsed.data.conversationId, role: 'admin' },
  });
  return jsonOk();
});
