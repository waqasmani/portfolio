'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, Paperclip, Send, Smile, X } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { trackEvent } from '@/lib/track-client';

interface ChatMessage {
  id: string;
  sender: 'VISITOR' | 'ADMIN' | 'BOT';
  authorName?: string | null;
  content: string;
  attachment?: { name: string; size: number; type: string } | null;
  createdAt: string;
}

interface ChatWidgetProps {
  online: boolean;
  responseTime: string;
  developerName: string;
  initials: string;
}

const EMOJIS = ['😀','😄','😊','🙂','😉','😎','🤔','👍','👋','🙏','💪','🔥','🎉','✨','❤️','💡','✅','❌','😅','😂','🤝','👀','🚀','☕'];

function getVisitorId(): string {
  try {
    const existing = localStorage.getItem('pf_chat_visitor');
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem('pf_chat_visitor', id);
    return id;
  } catch {
    return `mem-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

export function ChatWidget({ online, responseTime, developerName, initials }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState<'OPEN' | 'ASSIGNED' | 'CLOSED'>('OPEN');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lead, setLead] = useState({ name: '', email: '', message: '' });
  const [leadError, setLeadError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  const visitorIdRef = useRef<string>('');
  const listRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  // Keep a ref of `open` for the SSE handler without re-subscribing.
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // ---------------------------------------------------------------------
  // Bootstrapping: restore visitor id + previous conversation
  // ---------------------------------------------------------------------

  useEffect(() => {
    visitorIdRef.current = getVisitorId();

    fetch(`/api/chat/history?visitorId=${encodeURIComponent(visitorIdRef.current)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        // Restore remembered identity alongside the conversation, in one
        // async pass (avoids synchronous setState inside the effect body).
        try {
          const savedName = localStorage.getItem('pf_chat_name') ?? '';
          const savedEmail = localStorage.getItem('pf_chat_email') ?? '';
          if (savedName || savedEmail) {
            setLead((current) => ({ ...current, name: savedName, email: savedEmail }));
          }
        } catch {
          // storage unavailable
        }
        if (data?.conversation) {
          setConversationId(data.conversation.id);
          setConversationStatus(data.conversation.status);
          setMessages(data.conversation.messages);
        }
      })
      .catch(() => {})
      .finally(() => setRestored(true));
  }, []);

  // ---------------------------------------------------------------------
  // Live stream: stays open once a conversation exists (for unread badge)
  // ---------------------------------------------------------------------

  useEffect(() => {
    if (!conversationId) return;
    const source = new EventSource(
      `/api/chat/stream?conversation=${encodeURIComponent(conversationId)}&visitorId=${encodeURIComponent(visitorIdRef.current)}`
    );

    source.addEventListener('message', (event) => {
      try {
        const message = JSON.parse((event as MessageEvent).data) as ChatMessage;
        setMessages((current) =>
          current.some((item) => item.id === message.id) ? current : [...current, message]
        );
        if (message.sender !== 'VISITOR') {
          setAdminTyping(false);
          if (!openRef.current) setUnread((count) => count + 1);
        }
      } catch {
        // malformed event — ignore
      }
    });

    source.addEventListener('typing', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { role: string };
        if (payload.role === 'admin') {
          setAdminTyping(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setAdminTyping(false), 3200);
        }
      } catch {
        // ignore
      }
    });

    source.addEventListener('status', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { status: string };
        setConversationStatus(payload.status as 'OPEN' | 'ASSIGNED' | 'CLOSED');
      } catch {
        // ignore
      }
    });

    return () => source.close();
  }, [conversationId]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open, adminTyping]);


  // ---------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------

  const startConversation = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setLeadError(null);
      if (lead.name.trim().length < 2) {
        setLeadError('Please share your name so we know who we’re talking to.');
        return;
      }
      if (lead.message.trim().length === 0) {
        setLeadError('Write a first message to start the conversation.');
        return;
      }
      setStarting(true);
      try {
        const response = await fetch('/api/chat/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId: visitorIdRef.current,
            name: lead.name.trim(),
            email: lead.email.trim(),
            message: lead.message.trim(),
            pageUrl: window.location.pathname,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setLeadError(data.message ?? 'Could not start the chat. Please try again.');
          return;
        }
        setConversationId(data.conversationId);
        setConversationStatus('OPEN');
        setMessages(data.messages);
        setLead((current) => ({ ...current, message: '' }));
        trackEvent('chat_started');
        try {
          localStorage.setItem('pf_chat_name', lead.name.trim());
          if (lead.email.trim()) localStorage.setItem('pf_chat_email', lead.email.trim());
        } catch {
          // storage unavailable
        }
      } catch {
        setLeadError('Network error — check your connection and try again.');
      } finally {
        setStarting(false);
      }
    },
    [lead]
  );

  const sendMessage = useCallback(
    async (content: string, attachment?: { name: string; size: number; type: string; key?: string }) => {
      if (!conversationId || (!content.trim() && !attachment)) return;
      setSending(true);
      try {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            visitorId: visitorIdRef.current,
            content: content.trim() || `Sent a file: ${attachment?.name}`,
            attachment,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.message) {
          setMessages((current) =>
            current.some((item) => item.id === data.message.id) ? current : [...current, data.message]
          );
          setDraft('');
        } else if (response.status === 409) {
          setConversationStatus('CLOSED');
        }
      } catch {
        // Network hiccup — message stays in the draft box.
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  const onDraftChange = useCallback(
    (value: string) => {
      setDraft(value);
      const now = Date.now();
      if (conversationId && now - lastTypingSent.current > 2000) {
        lastTypingSent.current = now;
        void fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            visitorId: visitorIdRef.current,
            role: 'visitor',
          }),
        }).catch(() => {});
      }
    },
    [conversationId]
  );

  const onFileSelected = useCallback(
    async (file: File | undefined) => {
      if (!file || !conversationId) return;
      if (file.size > 5 * 1024 * 1024) return;
      setUploading(true);
      try {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/uploads', { method: 'POST', body });
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          await sendMessage(draft, { key: data.key, name: data.name, size: data.size, type: data.type });
        }
      } finally {
        setUploading(false);
      }
    },
    [conversationId, draft, sendMessage]
  );

  const resetForNewConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setConversationStatus('OPEN');
  }, []);

  const grouped = useMemo(() => messages, [messages]);

  if (!restored) return null;

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
        onClick={() =>
          setOpen((value) => {
            if (!value) setUnread(0);
            return !value;
          })
        }
        aria-label={open ? 'Close chat' : `Chat with ${developerName}`}
        aria-expanded={open}
        className="fixed right-5 bottom-5 z-[70] flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[var(--glow-accent)] transition-transform hover:scale-105 active:scale-95"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="size-6" aria-hidden />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="size-6" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 flex size-5.5 items-center justify-center rounded-full bg-rose text-[0.68rem] font-bold text-white ring-2 ring-bg">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        <span
          className={cn(
            'absolute top-0.5 right-0.5 size-3 rounded-full ring-2 ring-bg',
            online ? 'bg-emerald' : 'bg-amber'
          )}
          aria-hidden
        />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            role="dialog"
            aria-label="Live chat"
            className="fixed inset-x-3 bottom-22 z-[70] flex h-[min(38rem,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border border-line-strong bg-bg-raised shadow-[var(--shadow-soft)] sm:inset-x-auto sm:right-5 sm:w-[24rem]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-line bg-panel px-4 py-3.5">
              <span
                className="relative flex size-10 items-center justify-center rounded-full text-[0.8rem] font-bold text-[#0b1020]"
                style={{ background: 'var(--gradient-brand)' }}
              >
                {initials}
                <span
                  className={cn(
                    'absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-bg-raised',
                    online ? 'bg-emerald' : 'bg-amber'
                  )}
                  aria-hidden
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{developerName}</p>
                <p className="text-[0.72rem] text-muted">
                  {online ? 'Online — replies quickly' : `Away — replies ${responseTime.toLowerCase()}`}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Minimize chat"
                className="rounded-lg p-1.5 text-faint transition-colors hover:bg-panel-strong hover:text-ink"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* Body */}
            {!conversationId ? (
              /* Lead capture */
              <form onSubmit={startConversation} className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
                <div className="rounded-xl border border-line bg-panel p-4 text-[0.85rem] leading-relaxed text-muted">
                  👋 Hi! Ask about a project, availability, or anything technical.{' '}
                  {online ? 'We usually reply within minutes.' : `We're away right now but reply ${responseTime.toLowerCase()}.`}
                </div>
                <Field label="Name" htmlFor="chat-name" required>
                  <Input
                    id="chat-name"
                    value={lead.name}
                    onChange={(event) => setLead((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Email" htmlFor="chat-email" hint="Optional — so I can follow up if you leave.">
                  <Input
                    id="chat-email"
                    type="email"
                    value={lead.email}
                    onChange={(event) => setLead((current) => ({ ...current, email: event.target.value }))}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Message" htmlFor="chat-message" required>
                  <Textarea
                    id="chat-message"
                    rows={3}
                    value={lead.message}
                    onChange={(event) => setLead((current) => ({ ...current, message: event.target.value }))}
                    placeholder="What can I help you with?"
                    maxLength={2000}
                  />
                </Field>
                {leadError && (
                  <p className="text-[0.78rem] text-rose" role="alert">
                    {leadError}
                  </p>
                )}
                <Button type="submit" loading={starting} className="mt-auto w-full">
                  {starting ? 'Starting…' : 'Start chatting'}
                  {!starting && <Send className="size-4" aria-hidden />}
                </Button>
              </form>
            ) : (
              <>
                {/* Messages */}
                <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
                  {grouped.map((message) => {
                    const isVisitor = message.sender === 'VISITOR';
                    return (
                      <div key={message.id} className={cn('flex gap-2.5', isVisitor && 'flex-row-reverse')}>
                        {!isVisitor && (
                          <span
                            className="mt-auto flex size-7 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold text-[#0b1020]"
                            style={{ background: 'var(--gradient-brand)' }}
                            aria-hidden
                          >
                            {message.sender === 'BOT' ? 'AI' : initials}
                          </span>
                        )}
                        <div className={cn('max-w-[80%]', isVisitor && 'text-right')}>
                          <div
                            className={cn(
                              'inline-block rounded-2xl px-3.5 py-2.5 text-left text-[0.85rem] leading-relaxed break-words whitespace-pre-wrap',
                              isVisitor
                                ? 'rounded-br-md bg-accent text-accent-ink'
                                : 'rounded-bl-md border border-line bg-panel text-ink'
                            )}
                          >
                            {message.content}
                            {message.attachment && (
                              <span
                                className={cn(
                                  'mt-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.75rem]',
                                  isVisitor ? 'bg-black/15' : 'bg-panel-strong'
                                )}
                              >
                                <Paperclip className="size-3.5 shrink-0" aria-hidden />
                                <span className="truncate">{message.attachment.name}</span>
                                <span className="opacity-70">{formatBytes(message.attachment.size)}</span>
                              </span>
                            )}
                          </div>
                          <p className="mt-1 px-1 text-[0.65rem] text-faint">
                            {message.sender === 'BOT' ? 'Assistant · ' : ''}
                            {new Date(message.createdAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {adminTyping && (
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex size-7 items-center justify-center rounded-full text-[0.6rem] font-bold text-[#0b1020]"
                        style={{ background: 'var(--gradient-brand)' }}
                        aria-hidden
                      >
                        {initials}
                      </span>
                      <span className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-panel px-3.5 py-3" aria-label={`${developerName} is typing`}>
                        {[0, 1, 2].map((dot) => (
                          <motion.span
                            key={dot}
                            className="size-1.5 rounded-full bg-faint"
                            animate={reduceMotion ? undefined : { opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.18 }}
                          />
                        ))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Closed notice or composer */}
                {conversationStatus === 'CLOSED' ? (
                  <div className="border-t border-line p-4 text-center">
                    <p className="text-[0.8rem] text-muted">This conversation was closed.</p>
                    <Button variant="secondary" size="sm" className="mt-3" onClick={resetForNewConversation}>
                      Start a new conversation
                    </Button>
                  </div>
                ) : (
                  <div className="relative border-t border-line p-3">
                    {showEmoji && (
                      <div className="absolute right-3 bottom-full mb-2 grid grid-cols-8 gap-1 rounded-xl border border-line bg-bg-raised p-2 shadow-[var(--shadow-soft)]">
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setDraft((current) => `${current}${emoji}`);
                              setShowEmoji(false);
                            }}
                            className="rounded-md p-1 text-lg transition-colors hover:bg-panel-strong"
                            aria-label={`Insert ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void sendMessage(draft);
                      }}
                      className="flex items-end gap-2"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="sr-only"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.zip,.doc,.docx,.csv"
                        onChange={(event) => void onFileSelected(event.target.files?.[0])}
                        aria-label="Attach a file"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        aria-label="Attach file"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-faint transition-colors hover:bg-panel hover:text-ink disabled:opacity-50"
                      >
                        <Paperclip className={cn('size-4.5', uploading && 'animate-pulse')} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEmoji((value) => !value)}
                        aria-label="Insert emoji"
                        aria-expanded={showEmoji}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-faint transition-colors hover:bg-panel hover:text-ink"
                      >
                        <Smile className="size-4.5" />
                      </button>
                      <textarea
                        value={draft}
                        onChange={(event) => onDraftChange(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            void sendMessage(draft);
                          }
                        }}
                        placeholder="Write a message…"
                        aria-label="Message"
                        rows={1}
                        maxLength={2000}
                        className="max-h-28 min-h-9 flex-1 resize-none rounded-xl border border-line bg-panel px-3.5 py-2 text-[0.85rem] text-ink placeholder:text-faint focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sending || draft.trim().length === 0}
                        aria-label="Send message"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-all hover:bg-accent-strong disabled:opacity-40"
                      >
                        <Send className="size-4" />
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
