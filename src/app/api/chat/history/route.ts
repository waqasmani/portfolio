import { db } from '@/lib/db';
import { enforceLimit, jsonOk, withErrorHandling } from '@/lib/api';
import { limits } from '@/lib/rate-limit';
import { toPayload } from '@/lib/chat';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

/** Restore a visitor's latest conversation (scoped strictly to visitorId). */
export const GET = withErrorHandling('chat/history', async (req: Request) => {
  const limited = enforceLimit(req, 'chat-history', limits.beacon);
  if (limited) return limited;

  const visitorId = new URL(req.url).searchParams.get('visitorId')?.slice(0, 64);
  const settings = await getSettings();
  if (!visitorId || visitorId.length < 8) {
    return jsonOk({ conversation: null, online: settings.chatOnline });
  }

  const conversation = await db.chatConversation.findFirst({
    where: { visitorId },
    orderBy: { lastMessageAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 100 } },
  });

  if (!conversation) return jsonOk({ conversation: null, online: settings.chatOnline });

  await db.chatConversation
    .update({ where: { id: conversation.id }, data: { visitorLastSeenAt: new Date() } })
    .catch(() => {});

  return jsonOk({
    online: settings.chatOnline,
    conversation: {
      id: conversation.id,
      status: conversation.status,
      visitorName: conversation.visitorName,
      messages: conversation.messages.map((item) => toPayload(item)),
    },
  });
});
