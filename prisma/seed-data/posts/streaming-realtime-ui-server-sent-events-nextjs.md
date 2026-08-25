WebSockets get all the attention, but most "real-time" product features — live dashboards, notifications, chat, progress indicators — only need **server → client** streaming. For that, Server-Sent Events (SSE) are simpler, friendlier to proxies, and work with plain `fetch` semantics. This site's live chat runs on SSE, and this post walks through the exact pattern.

## Why SSE instead of WebSockets?

WebSockets give you a bidirectional socket, which is more than most features need — and you pay for the extra power:

- A custom server or upgrade handling, which complicates Next.js deployments
- Manual reconnection, heartbeat, and backoff logic
- Trickier behavior behind corporate proxies and some load balancers

SSE, by contrast, is *just an HTTP response that never ends*. The browser's `EventSource` API reconnects automatically, sends a `Last-Event-ID` header so you can replay missed events, and passes through anything that speaks HTTP. Client-to-server messages go over normal `POST` requests — which you already have.

The rule of thumb we use: if the client mostly *listens*, use SSE. If the client and server genuinely converse at high frequency (multiplayer cursors, collaborative editing), reach for WebSockets.

## The server: a streaming route handler

In the App Router, an SSE endpoint is a route handler that returns a `ReadableStream`:

```ts
// app/api/chat/stream/route.ts
import { chatBus } from '@/lib/chat-bus';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversation');
  if (!conversationId) return new Response('Missing conversation', { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Replay is handled by the client sending its last-seen message id.
      const unsubscribe = chatBus.subscribe(conversationId, (msg) => {
        send('message', msg);
      });

      // Keep intermediaries from timing out the idle connection.
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 25_000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable buffering in Nginx
    },
  });
}
```

Three details matter more than they look:

1. **The heartbeat comment.** Lines starting with `:` are ignored by `EventSource`, but they keep proxies and load balancers from killing an "idle" connection.
2. **`X-Accel-Buffering: no`.** Without it, Nginx buffers your stream and events arrive in batches — or never.
3. **Cleanup on `abort`.** Every subscription and interval must be torn down when the client disconnects, or you leak memory one tab at a time.

## The event bus

The bus is deliberately boring — a map of topic → subscribers:

```ts
// lib/chat-bus.ts
type Listener = (data: unknown) => void;

class EventBus {
  private topics = new Map<string, Set<Listener>>();

  subscribe(topic: string, fn: Listener) {
    const set = this.topics.get(topic) ?? new Set();
    set.add(fn);
    this.topics.set(topic, set);
    return () => {
      set.delete(fn);
      if (set.size === 0) this.topics.delete(topic);
    };
  }

  publish(topic: string, data: unknown) {
    this.topics.get(topic)?.forEach((fn) => fn(data));
  }
}

export const chatBus = new EventBus();
```

This works because a self-hosted Next.js app (PM2, Docker) is a long-lived process. If you scale to multiple nodes, swap the internals for Redis pub/sub — the interface stays identical, which is exactly why it's an interface.

## The client: EventSource with graceful degradation

```tsx
useEffect(() => {
  const source = new EventSource(`/api/chat/stream?conversation=${id}`);

  source.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
    );
  });

  source.onerror = () => {
    // EventSource reconnects on its own; surface state to the UI instead
    setConnection('reconnecting');
  };

  return () => source.close();
}, [id]);
```

Note the deduplication by `id`: after a reconnect you may fetch history *and* receive the same message from the stream. Making the reducer idempotent removes a whole class of bugs.

## Production checklist

- Send a heartbeat every 20–30 seconds
- Disable proxy buffering (`X-Accel-Buffering`, `proxy_buffering off`)
- Make client reducers idempotent — events *will* be delivered twice
- Tear down subscriptions on `abort`, and cap subscribers per topic
- Fall back to short polling when `EventSource` is unavailable (rare, but free to add)

SSE won't headline a conference talk, and that's the point: it's the least machinery that honestly solves server-push. Boring transports leave more of your complexity budget for the product.
