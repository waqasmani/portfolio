import { db } from '@/lib/db';
import { jsonError, withErrorHandling } from '@/lib/api';
import { sseResponse } from '@/lib/sse';

export const dynamic = 'force-dynamic';

/** Visitor SSE stream for one conversation (ownership-checked). */
export const GET = withErrorHandling('chat/stream', async (req: Request) => {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get('conversation')?.slice(0, 64);
  const visitorId = url.searchParams.get('visitorId')?.slice(0, 64);

  if (!conversationId || !visitorId) return jsonError(400, 'Missing conversation or visitor id');

  const conversation = await db.chatConversation.findUnique({
    where: { id: conversationId },
    select: { visitorId: true },
  });
  if (!conversation || conversation.visitorId !== visitorId) {
    return jsonError(403, 'Not your conversation');
  }

  return sseResponse(req, [`conv:${conversationId}`]);
});
