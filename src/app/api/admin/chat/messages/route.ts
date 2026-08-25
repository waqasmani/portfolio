import { z } from 'zod';
import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { enforceLimit, jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { limits } from '@/lib/rate-limit';
import { appendMessage, toPayload } from '@/lib/chat';

export const dynamic = 'force-dynamic';

/** Admin: fetch a conversation's messages (marks it read). */
export const GET = withErrorHandling('admin/chat/messages GET', async (req: Request) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const conversationId = new URL(req.url).searchParams.get('conversation')?.slice(0, 64);
  if (!conversationId) return jsonError(400, 'Missing conversation');

  const conversation = await db.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 200, include: { author: { select: { name: true } } } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
  if (!conversation) return jsonError(404, 'Conversation not found');

  await db.chatConversation
    .update({ where: { id: conversationId }, data: { adminLastSeenAt: new Date() } })
    .catch(() => {});

  return jsonOk({
    conversation: {
      id: conversation.id,
      visitorName: conversation.visitorName,
      visitorEmail: conversation.visitorEmail,
      status: conversation.status,
      assignedTo: conversation.assignedTo,
      pageUrl: conversation.pageUrl,
      userAgent: conversation.userAgent,
      createdAt: conversation.createdAt.toISOString(),
    },
    messages: conversation.messages.map((message) => toPayload(message, message.author?.name)),
  });
});

const sendSchema = z.object({
  conversationId: z.string().min(8).max(64),
  content: z.string().trim().min(1).max(2000),
});

/** Admin: send a reply. */
export const POST = withErrorHandling('admin/chat/messages POST', async (req: Request) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const limited = enforceLimit(req, `admin-chat:${user.id}`, limits.chat);
  if (limited) return limited;

  const parsed = sendSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(422, 'Invalid message');

  const conversation = await db.chatConversation.findUnique({
    where: { id: parsed.data.conversationId },
  });
  if (!conversation) return jsonError(404, 'Conversation not found');

  const payload = await appendMessage({
    conversationId: conversation.id,
    sender: 'ADMIN',
    content: parsed.data.content,
    authorId: user.id,
    authorName: user.name,
  });

  await db.chatConversation
    .update({ where: { id: conversation.id }, data: { adminLastSeenAt: new Date() } })
    .catch(() => {});

  return jsonOk({ message: payload });
});
