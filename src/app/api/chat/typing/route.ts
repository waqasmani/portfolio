import { db } from '@/lib/db';
import { enforceLimit, jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { chatTypingSchema } from '@/lib/schemas';
import { chatBus } from '@/lib/chat-bus';

export const dynamic = 'force-dynamic';

/** Visitor typing indicator — ephemeral, never persisted. */
export const POST = withErrorHandling('chat/typing', async (req: Request) => {
  const limited = enforceLimit(req, 'chat-typing', { capacity: 20, refillPerSec: 1 });
  if (limited) return limited;

  const parsed = chatTypingSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(422, 'Invalid payload');
  const { conversationId, visitorId, role } = parsed.data;

  if (role === 'visitor') {
    const conversation = await db.chatConversation.findUnique({
      where: { id: conversationId },
      select: { visitorId: true },
    });
    if (!conversation || conversation.visitorId !== visitorId) {
      return jsonError(403, 'Not your conversation');
    }
  } else {
    // Admin typing goes through the authenticated admin route instead.
    return jsonError(403, 'Use the admin endpoint');
  }

  chatBus.publish(`conv:${conversationId}`, {
    kind: 'typing',
    payload: { conversationId, role: 'visitor' },
  });
  return jsonOk();
});
