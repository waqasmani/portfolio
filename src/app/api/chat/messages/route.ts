import { z } from 'zod';
import { db } from '@/lib/db';
import { enforceLimit, jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { limits } from '@/lib/rate-limit';
import { chatMessageSchema } from '@/lib/schemas';
import { appendMessage, maybeAutoRespond } from '@/lib/chat';

export const dynamic = 'force-dynamic';

/** Visitor sends a message into their conversation. */
export const POST = withErrorHandling('chat/messages', async (req: Request) => {
  const limited = enforceLimit(req, 'chat-msg', limits.chat);
  if (limited) return limited;

  const parsed = chatMessageSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Invalid message', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }
  const { conversationId, visitorId, content, attachment } = parsed.data;

  // Ownership check: the visitor token must match the conversation.
  const conversation = await db.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conversation || !visitorId || conversation.visitorId !== visitorId) {
    return jsonError(403, 'This conversation is not yours to write to.');
  }
  if (conversation.status === 'CLOSED') {
    return jsonError(409, 'This conversation has been closed. Start a new one from the chat window.');
  }

  const payload = await appendMessage({
    conversationId,
    sender: 'VISITOR',
    content,
    attachment: attachment ?? null,
  });
  await db.chatConversation
    .update({ where: { id: conversationId }, data: { visitorLastSeenAt: new Date() } })
    .catch(() => {});
  await maybeAutoRespond(conversationId, content);

  return jsonOk({ message: payload });
});
