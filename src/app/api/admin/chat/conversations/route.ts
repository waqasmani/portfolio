import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, withErrorHandling } from '@/lib/api';
import type { Prisma } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

/** Admin: list conversations with status filter + search. */
export const GET = withErrorHandling('admin/chat/conversations', async (req: Request) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const query = url.searchParams.get('q')?.trim().slice(0, 100);

  const where: Prisma.ChatConversationWhereInput = {
    ...(status && ['OPEN', 'ASSIGNED', 'CLOSED'].includes(status)
      ? { status: status as 'OPEN' | 'ASSIGNED' | 'CLOSED' }
      : {}),
    ...(query
      ? {
          OR: [
            { visitorName: { contains: query, mode: 'insensitive' } },
            { visitorEmail: { contains: query, mode: 'insensitive' } },
            { messages: { some: { content: { contains: query, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  const conversations = await db.chatConversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
    include: {
      assignedTo: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return jsonOk({
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      visitorName: conversation.visitorName,
      visitorEmail: conversation.visitorEmail,
      status: conversation.status,
      assignedTo: conversation.assignedTo,
      pageUrl: conversation.pageUrl,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
      lastMessage: conversation.messages[0]
        ? {
            content: conversation.messages[0].content.slice(0, 120),
            sender: conversation.messages[0].sender,
            createdAt: conversation.messages[0].createdAt.toISOString(),
          }
        : null,
      unread:
        conversation.adminLastSeenAt === null ||
        conversation.lastMessageAt > conversation.adminLastSeenAt,
    })),
  });
});
