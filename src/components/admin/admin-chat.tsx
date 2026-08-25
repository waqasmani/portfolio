'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Archive,
  Check,
  Globe,
  MessageSquare,
  RotateCcw,
  Search,
  Send,
  UserCheck,
} from 'lucide-react';
import { cn, formatDateTime, initials, timeAgo } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

interface ConversationSummary {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED';
  assignedTo: { id: string; name: string } | null;
  pageUrl: string | null;
  lastMessageAt: string;
  createdAt: string;
  lastMessage: { content: string; sender: string; createdAt: string } | null;
  unread: boolean;
}

interface ThreadMessage {
  id: string;
  sender: 'VISITOR' | 'ADMIN' | 'BOT';
  authorName?: string | null;
  content: string;
  attachment?: { name: string; size: number; type: string; key?: string } | null;
  createdAt: string;
}

interface ThreadInfo {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED';
  assignedTo: { id: string; name: string } | null;
  pageUrl: string | null;
  createdAt: string;
}

export function AdminChat({ currentUser }: { currentUser: { id: string; name: string } }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'CLOSED' | 'ALL'>('ACTIVE');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<{ info: ThreadInfo; messages: ThreadMessage[] } | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);
  const { toast } = useToast();
  activeIdRef.current = activeId;

  // -----------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------

  const loadConversations = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter === 'CLOSED') params.set('status', 'CLOSED');
    if (query.trim()) params.set('q', query.trim());
    try {
      const response = await fetch(`/api/admin/chat/conversations?${params}`);
      if (!response.ok) return;
      const data = await response.json();
      let list: ConversationSummary[] = data.conversations;
      if (statusFilter === 'ACTIVE') {
        list = list.filter((conversation) => conversation.status !== 'CLOSED');
      }
      setConversations(list);
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, query]);

  const loadThread = useCallback(async (conversationId: string) => {
    setLoadingThread(true);
    try {
      const response = await fetch(`/api/admin/chat/messages?conversation=${conversationId}`);
      if (!response.ok) return;
      const data = await response.json();
      setThread({ info: data.conversation, messages: data.messages });
      setConversations((current) =>
        current.map((item) => (item.id === conversationId ? { ...item, unread: false } : item))
      );
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) void loadThread(activeId);
    else setThread(null);
  }, [activeId, loadThread]);

  // -----------------------------------------------------------------
  // Live stream: inbox + active conversation
  // -----------------------------------------------------------------

  useEffect(() => {
    const url = activeId
      ? `/api/admin/chat/stream?conversation=${encodeURIComponent(activeId)}`
      : '/api/admin/chat/stream';
    const source = new EventSource(url);

    source.addEventListener('inbox', () => void loadConversations());

    source.addEventListener('message', (event) => {
      try {
        const message = JSON.parse((event as MessageEvent).data) as ThreadMessage & {
          conversationId: string;
        };
        if (message.conversationId !== activeIdRef.current) return;
        setVisitorTyping(false);
        setThread((current) =>
          current && !current.messages.some((item) => item.id === message.id)
            ? { ...current, messages: [...current.messages, message] }
            : current
        );
        // Seeing it live counts as reading it.
        void fetch(`/api/admin/chat/conversations/${message.conversationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markRead: true }),
        }).catch(() => {});
      } catch {
        // ignore malformed events
      }
    });

    source.addEventListener('typing', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          conversationId: string;
          role: string;
        };
        if (payload.role === 'visitor' && payload.conversationId === activeIdRef.current) {
          setVisitorTyping(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setVisitorTyping(false), 3200);
        }
      } catch {
        // ignore
      }
    });

    return () => source.close();
  }, [activeId, loadConversations]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [thread?.messages, visitorTyping]);

  // -----------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------

  async function sendReply() {
    if (!activeId || draft.trim().length === 0) return;
    setSending(true);
    try {
      const response = await fetch('/api/admin/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, content: draft.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.message) {
        setThread((current) =>
          current && !current.messages.some((item) => item.id === data.message.id)
            ? { ...current, messages: [...current.messages, data.message] }
            : current
        );
        setDraft('');
      } else {
        toast('error', 'Could not send the reply', data.message);
      }
    } finally {
      setSending(false);
    }
  }

  async function updateConversation(patch: Record<string, unknown>, successNote?: string) {
    if (!activeId) return;
    const response = await fetch(`/api/admin/chat/conversations/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (response.ok) {
      const data = await response.json();
      setThread((current) =>
        current
          ? {
              ...current,
              info: {
                ...current.info,
                status: data.conversation.status,
                assignedTo: data.conversation.assignedTo,
              },
            }
          : current
      );
      void loadConversations();
      if (successNote) toast('success', successNote);
    } else {
      toast('error', 'Update failed');
    }
  }

  function onDraftChange(value: string) {
    setDraft(value);
    const now = Date.now();
    if (activeId && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      void fetch('/api/admin/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId }),
      }).catch(() => {});
    }
  }

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------

  return (
    <div className="grid h-[calc(100dvh-13rem)] min-h-[30rem] overflow-hidden rounded-2xl border border-line bg-panel lg:grid-cols-[20rem_1fr]">
      {/* Conversation list */}
      <div className={cn('flex min-h-0 flex-col border-line lg:border-r', activeId && 'hidden lg:flex')}>
        <div className="space-y-3 border-b border-line p-3.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations…"
              aria-label="Search conversations"
              className="w-full rounded-lg border border-line bg-bg-raised py-2 pr-3 pl-9 text-[0.82rem] text-ink placeholder:text-faint focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:outline-none"
            />
          </div>
          <div className="flex gap-1.5" role="tablist" aria-label="Filter conversations">
            {(['ACTIVE', 'CLOSED', 'ALL'] as const).map((option) => (
              <button
                key={option}
                role="tab"
                aria-selected={statusFilter === option}
                onClick={() => setStatusFilter(option)}
                className={cn(
                  'rounded-full px-3 py-1 text-[0.72rem] font-medium transition-colors',
                  statusFilter === option
                    ? 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent'
                    : 'text-muted hover:text-ink'
                )}
              >
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex justify-center py-10">
              <Spinner className="text-faint" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-faint">No conversations found</p>
          ) : (
            <ul className="divide-y divide-line">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    onClick={() => setActiveId(conversation.id)}
                    className={cn(
                      'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-panel-strong',
                      activeId === conversation.id && 'bg-panel-strong'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[0.85rem] font-medium text-ink">
                        {conversation.visitorName ?? 'Anonymous visitor'}
                      </span>
                      {conversation.unread && (
                        <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />
                      )}
                      <span className="shrink-0 font-mono text-[0.65rem] text-faint">
                        {timeAgo(conversation.lastMessageAt)}
                      </span>
                    </span>
                    {conversation.lastMessage && (
                      <span className="truncate text-[0.75rem] text-muted">
                        {conversation.lastMessage.sender === 'VISITOR' ? '' : '↩ '}
                        {conversation.lastMessage.content}
                      </span>
                    )}
                    <span className="mt-0.5 flex items-center gap-2">
                      <StatusBadge status={conversation.status} />
                      {conversation.assignedTo && (
                        <span className="truncate text-[0.68rem] text-faint">
                          → {conversation.assignedTo.name}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className={cn('min-h-0 flex-col', activeId ? 'flex' : 'hidden lg:flex')}>
        {!thread && !loadingThread ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={MessageSquare}
              title="Pick a conversation"
              description="Select a conversation from the list to read and reply in real time."
              className="border-0"
            />
          </div>
        ) : loadingThread || !thread ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="text-faint" />
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
              <button
                onClick={() => setActiveId(null)}
                className="text-[0.78rem] font-medium text-accent lg:hidden"
              >
                ← Back
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9rem] font-semibold text-ink">
                  {thread.info.visitorName ?? 'Anonymous visitor'}
                  {thread.info.visitorEmail && (
                    <span className="ml-2 font-normal text-muted">{thread.info.visitorEmail}</span>
                  )}
                </p>
                <p className="flex items-center gap-1.5 truncate text-[0.7rem] text-faint">
                  <Globe className="size-3" aria-hidden />
                  {thread.info.pageUrl ?? 'unknown page'} · started {formatDateTime(thread.info.createdAt)}
                </p>
              </div>
              <StatusBadge status={thread.info.status} />
              {thread.info.assignedTo?.id !== currentUser.id ? (
                <button
                  onClick={() => void updateConversation({ assignToMe: true }, 'Assigned to you')}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.75rem] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
                >
                  <UserCheck className="size-3.5" aria-hidden />
                  Assign to me
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[0.72rem] text-emerald">
                  <Check className="size-3.5" aria-hidden /> Yours
                </span>
              )}
              {thread.info.status !== 'CLOSED' ? (
                <button
                  onClick={() => void updateConversation({ status: 'CLOSED' }, 'Conversation closed')}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.75rem] font-medium text-muted transition-colors hover:border-[color-mix(in_srgb,var(--rose)_45%,transparent)] hover:text-rose"
                >
                  <Archive className="size-3.5" aria-hidden />
                  Close
                </button>
              ) : (
                <button
                  onClick={() => void updateConversation({ status: 'OPEN' }, 'Conversation reopened')}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.75rem] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Reopen
                </button>
              )}
            </div>

            {/* Messages */}
            <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-bg/40 p-4">
              {thread.messages.map((message) => {
                const isAdminSide = message.sender !== 'VISITOR';
                return (
                  <div key={message.id} className={cn('flex gap-2.5', isAdminSide && 'flex-row-reverse')}>
                    <span
                      className={cn(
                        'mt-auto flex size-7 shrink-0 items-center justify-center rounded-full text-[0.58rem] font-bold',
                        isAdminSide ? 'bg-accent text-accent-ink' : 'border border-line bg-panel text-muted'
                      )}
                      aria-hidden
                    >
                      {message.sender === 'BOT'
                        ? 'AI'
                        : message.sender === 'ADMIN'
                          ? initials(message.authorName ?? currentUser.name)
                          : initials(thread.info.visitorName ?? 'V')}
                    </span>
                    <div className={cn('max-w-[75%]', isAdminSide && 'text-right')}>
                      <div
                        className={cn(
                          'inline-block rounded-2xl px-3.5 py-2.5 text-left text-[0.85rem] leading-relaxed break-words whitespace-pre-wrap',
                          isAdminSide
                            ? 'rounded-br-md bg-accent text-accent-ink'
                            : 'rounded-bl-md border border-line bg-panel text-ink'
                        )}
                      >
                        {message.content}
                        {message.attachment?.key && (
                          <a
                            href={`/api/admin/uploads?key=${encodeURIComponent(message.attachment.key)}`}
                            className={cn(
                              'mt-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.75rem] underline underline-offset-2',
                              isAdminSide ? 'bg-black/15' : 'bg-panel-strong'
                            )}
                          >
                            📎 {message.attachment.name}
                          </a>
                        )}
                      </div>
                      <p className="mt-1 px-1 text-[0.65rem] text-faint">
                        {message.sender === 'BOT' ? 'Auto-assistant · ' : ''}
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {visitorTyping && (
                <p className="text-[0.75rem] text-faint italic">
                  {thread.info.visitorName ?? 'Visitor'} is typing…
                </p>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendReply();
              }}
              className="flex items-end gap-2 border-t border-line p-3"
            >
              <textarea
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendReply();
                  }
                }}
                placeholder={
                  thread.info.status === 'CLOSED' ? 'Reopen the conversation to reply…' : 'Reply as admin…'
                }
                aria-label="Reply"
                rows={1}
                maxLength={2000}
                disabled={thread.info.status === 'CLOSED'}
                className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-line bg-bg-raised px-3.5 py-2.5 text-[0.85rem] text-ink placeholder:text-faint focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sending || draft.trim().length === 0 || thread.info.status === 'CLOSED'}
                aria-label="Send reply"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-all hover:bg-accent-strong disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
