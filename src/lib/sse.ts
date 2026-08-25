import 'server-only';
import { chatBus, type ChatEvent } from '@/lib/chat-bus';

/**
 * Server-Sent Events response builder. Subscribes to one or more chat bus
 * topics, forwards events, heartbeats every 25s so proxies keep the
 * connection open, and tears everything down when the client disconnects.
 */
export function sseResponse(req: Request, topics: string[]): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const send = (event: ChatEvent) => {
        write(`event: ${event.kind}\ndata: ${JSON.stringify(event.payload)}\n\n`);
      };

      const unsubscribes = topics.map((topic) => chatBus.subscribe(topic, send));
      const heartbeat = setInterval(() => write(`: ping\n\n`), 25_000);

      // Confirm the stream is live so clients can show "connected".
      write(`event: ready\ndata: {}\n\n`);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribes.forEach((unsubscribe) => unsubscribe());
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
