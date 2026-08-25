import { z } from 'zod';
import { db } from '@/lib/db';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { chatBus } from '@/lib/chat-bus';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  status: z.enum(['OPEN', 'ASSIGNED', 'CLOSED']).optional(),
  assignToMe: z.boolean().optional(),
  unassign: z.boolean().optional(),
  markRead: z.boolean().optional(),
});

/** Admin: update one conversation (assign, close, reopen, mark read). */
export const PATCH = withErrorHandling('admin/chat/conversation', async (
  req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(422, 'Invalid payload');
  const { status, assignToMe, unassign, markRead } = parsed.data;

  const existing = await db.chatConversation.findUnique({ where: { id } });
  if (!existing) return jsonError(404, 'Conversation not found');

  const conversation = await db.chatConversation.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(assignToMe ? { assignedToId: user.id, status: status ?? 'ASSIGNED' } : {}),
      ...(unassign ? { assignedToId: null } : {}),
      ...(markRead ? { adminLastSeenAt: new Date() } : {}),
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  if (status) {
    chatBus.publishToConversation(id, {
      kind: 'status',
      payload: { conversationId: id, status },
    });
  }

  return jsonOk({
    conversation: {
      id: conversation.id,
      status: conversation.status,
      assignedTo: conversation.assignedTo,
    },
  });
});
