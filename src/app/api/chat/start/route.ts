import { z } from 'zod';
import { db } from '@/lib/db';
import { enforceLimit, jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { limits } from '@/lib/rate-limit';
import { chatStartSchema } from '@/lib/schemas';
import { appendMessage, maybeAutoRespond, toPayload } from '@/lib/chat';
import { getSettings } from '@/lib/settings';
import { track } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

/** Start (or resume) a conversation for a visitor after lead capture. */
export const POST = withErrorHandling('chat/start', async (req: Request) => {
  const limited = enforceLimit(req, 'chat-start', limits.form);
  if (limited) return limited;

  const parsed = chatStartSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Please fix the highlighted fields.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }
  const { visitorId, name, email, message, pageUrl } = parsed.data;

  // Reuse an open conversation for this visitor if one exists.
  let conversation = await db.chatConversation.findFirst({
    where: { visitorId, status: { not: 'CLOSED' } },
    orderBy: { lastMessageAt: 'desc' },
  });

  if (!conversation) {
    conversation = await db.chatConversation.create({
      data: {
        visitorId,
        visitorName: name,
        visitorEmail: email || null,
        pageUrl: pageUrl?.slice(0, 300) ?? null,
        userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
      },
    });
    await track(req, { type: 'event', name: 'chat_started', path: pageUrl ?? '/' });
  }

  await appendMessage({
    conversationId: conversation.id,
    sender: 'VISITOR',
    content: message,
  });
  await maybeAutoRespond(conversation.id, message);

  const [messages, settings] = await Promise.all([
    db.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    }),
    getSettings(),
  ]);

  return jsonOk({
    conversationId: conversation.id,
    online: settings.chatOnline,
    messages: messages.map((item) => toPayload(item)),
  });
});
