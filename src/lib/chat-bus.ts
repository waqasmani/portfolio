import 'server-only';

/**
 * In-process pub/sub bus powering the live chat's Server-Sent Events.
 *
 * Topics:
 *   `conv:{conversationId}` — message/typing/status events for one thread
 *   `admin:inbox`           — conversation list updates for the admin panel
 *
 * Single-instance by design (PM2 fork / Docker container). To scale
 * horizontally, replace the internals with Redis pub/sub — the interface is
 * the contract, and it stays identical.
 */

export type ChatEvent =
  | { kind: 'message'; payload: ChatMessagePayload }
  | { kind: 'typing'; payload: { conversationId: string; role: 'visitor' | 'admin' } }
  | { kind: 'status'; payload: { conversationId: string; status: string } }
  | { kind: 'inbox'; payload: { conversationId: string } };

export interface ChatMessagePayload {
  id: string;
  conversationId: string;
  sender: 'VISITOR' | 'ADMIN' | 'BOT';
  authorName?: string | null;
  content: string;
  attachment?: { name: string; size: number; type: string } | null;
  createdAt: string;
}

type Listener = (event: ChatEvent) => void;

const MAX_LISTENERS_PER_TOPIC = 50;

class ChatBus {
  private topics = new Map<string, Set<Listener>>();

  subscribe(topic: string, listener: Listener): () => void {
    const set = this.topics.get(topic) ?? new Set();
    if (set.size >= MAX_LISTENERS_PER_TOPIC) {
      // Shed the oldest listener rather than grow unboundedly.
      const first = set.values().next().value;
      if (first) set.delete(first);
    }
    set.add(listener);
    this.topics.set(topic, set);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.topics.delete(topic);
    };
  }

  publish(topic: string, event: ChatEvent): void {
    this.topics.get(topic)?.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // A broken listener must never take down the publisher.
      }
    });
  }

  /** Convenience: publish to a conversation topic and notify the admin inbox. */
  publishToConversation(conversationId: string, event: ChatEvent): void {
    this.publish(`conv:${conversationId}`, event);
    this.publish('admin:inbox', { kind: 'inbox', payload: { conversationId } });
  }

  listenerCount(topic: string): number {
    return this.topics.get(topic)?.size ?? 0;
  }
}

const store = globalThis as unknown as { __chatBus?: ChatBus };
export const chatBus = (store.__chatBus ??= new ChatBus());
