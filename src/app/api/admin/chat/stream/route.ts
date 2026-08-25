import { getApiUser } from '@/lib/auth';
import { jsonError, withErrorHandling } from '@/lib/api';
import { sseResponse } from '@/lib/sse';

export const dynamic = 'force-dynamic';

/**
 * Admin SSE stream: inbox updates for the conversation list, plus live
 * events for the currently open conversation when provided.
 */
export const GET = withErrorHandling('admin/chat/stream', async (req: Request) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const conversationId = new URL(req.url).searchParams.get('conversation')?.slice(0, 64);
  const topics = ['admin:inbox'];
  if (conversationId) topics.push(`conv:${conversationId}`);

  return sseResponse(req, topics);
});
