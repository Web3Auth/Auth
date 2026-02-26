import { Duplex } from "readable-stream";

import { isRequest } from "../../utils/jrpc";
import { rpcErrors } from "../errors";
import { JRPCRequest, Json } from "../interfaces";
import { SafeEventEmitter } from "../safeEventEmitter";
import { JRPCEngineV2 } from "./jrpcEngineV2";

/**
 * Creates a Duplex object stream for an engine (JRPCEngineV2) + a separate notification emitter.
 *
 * Replaces V1's createEngineStream by decoupling notification forwarding from
 * the engine itself. Notifications are routed through a SafeEventEmitter that
 * pushes onto the same stream, so the engine no longer needs to be an EventEmitter.
 */
export function createEngineStreamV2({ engine, notificationEmitter }: { engine: JRPCEngineV2; notificationEmitter?: SafeEventEmitter }): Duplex {
  let stream: Duplex | undefined = undefined;

  function noop() {
    // noop
  }

  function write(req: JRPCRequest<unknown>, _encoding: BufferEncoding, cb: () => void) {
    engine
      .handle(req)
      .then((res: Json | void): void => {
        if (res !== undefined && isRequest(req)) {
          stream?.push({
            id: req.id,
            jsonrpc: "2.0",
            result: res,
          });
        }
        return undefined;
      })
      .catch((err: unknown) => {
        if (isRequest(req)) {
          const message = err instanceof Error ? err.message : "Internal JSON-RPC error";
          stream?.push({
            id: req.id,
            jsonrpc: "2.0",
            error: rpcErrors.internal({ message }),
          });
        }
      });

    cb();
  }

  stream = new Duplex({ objectMode: true, read: noop, write });

  if (notificationEmitter) {
    const onNotification = (message: unknown) => {
      stream?.push(message);
    };

    notificationEmitter.on("notification", onNotification);
    stream?.once("close", () => {
      notificationEmitter.removeListener("notification", onNotification);
    });
  }

  return stream;
}
