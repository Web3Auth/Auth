import { Duplex } from "readable-stream";

import { JRPCRequest, Json } from "../interfaces";
import { SafeEventEmitter } from "../safeEventEmitter";
import { JRPCMiddlewareV2 } from "./v2interfaces";

/**
 * Creates a V2-compatible client-side stream middleware for the dapp ↔ iframe
 * transport layer.
 *
 * Replaces V1's `createStreamMiddleware` by providing:
 * - A terminal middleware that sends outbound requests through the stream and
 *   resolves when the matching response arrives.
 * - A Duplex object stream to pump through the ObjectMultiplex channel.
 * - Inbound notification routing via the supplied `notificationEmitter`.
 */
export function createClientStreamMiddlewareV2({ notificationEmitter }: { notificationEmitter?: SafeEventEmitter } = {}): {
  middleware: JRPCMiddlewareV2<JRPCRequest<unknown>, Json>;
  stream: Duplex;
} {
  const pendingRequests = new Map<number | string, { resolve: (result: Json) => void; reject: (error: unknown) => void }>();

  function noop() {
    // noop
  }

  function write(this: Duplex, data: Record<string, unknown>, _encoding: BufferEncoding, cb: () => void) {
    if (data.method !== undefined) {
      // Inbound request or notification from remote — route to event emitter
      // (matches V1 createStreamMiddleware behavior where all non-response
      // messages are emitted as "notification" regardless of whether they
      // carry an id)
      notificationEmitter?.emit("notification", data);
    } else {
      // No method → this is a response to one of our pending outbound requests
      const id = data.id as number | string | undefined;
      if (id !== undefined && id !== null && pendingRequests.has(id)) {
        const pending = pendingRequests.get(id)!;
        pendingRequests.delete(id);

        if (data.error) {
          const errorObj = data.error as { code?: number; message?: string; data?: unknown };
          pending.reject(Object.assign(new Error(errorObj.message || "Internal JSON-RPC error"), { code: errorObj.code, data: errorObj.data }));
        } else {
          pending.resolve(data.result as Json);
        }
      }
    }

    cb();
  }

  const stream = new Duplex({ objectMode: true, read: noop, write });

  stream.once("close", () => {
    const error = new Error("Stream closed");
    pendingRequests.forEach(({ reject }) => reject(error));
    pendingRequests.clear();
  });

  const middleware: JRPCMiddlewareV2<JRPCRequest<unknown>, Json> = ({ request }) => {
    return new Promise<Json>((resolve, reject) => {
      pendingRequests.set(request.id as number | string, { resolve, reject });
      stream.push(request);
    });
  };

  return { middleware, stream };
}
