import { JsonRpcMiddleware } from "json-rpc-engine";
import { Duplex } from "stream";

import SafeEventEmitter from "./safeEventEmitter";
import SerializableError from "./serializableError";

export type JRPCVersion = "2.0";
export type JRPCId = number | string | void;

export type ConsoleLike = Pick<Console, "log" | "warn" | "error" | "debug" | "info" | "trace">;
export interface JRPCBase {
  jsonrpc?: JRPCVersion;
  id?: JRPCId;
}

export interface JRPCResponse<T> extends JRPCBase {
  result?: T;
  error?: any;
}

export interface JRPCRequest<T> extends JRPCBase {
  method: string;
  params?: T;
}

export type JRPCMiddleware<T, U> = (req: JRPCRequest<T>, res: JRPCResponse<U>, next: any, end: any) => void;

export function createErrorMiddleware(log: ConsoleLike): JsonRpcMiddleware<unknown, unknown> {
  return (req, res, next) => {
    // json-rpc-engine will terminate the request when it notices this error
    if (typeof req.method !== "string" || !req.method) {
      res.error = new SerializableError({ message: "invalid method" });
    }

    next((done) => {
      const { error } = res;
      if (!error) {
        return done();
      }
      log.error(`MetaMask - RPC Error: ${error.message}`, error);
      return done();
    });
  };
}
export type JRPCEngineNextCallback = (cb?: (done: (error?: Error) => void) => void) => void;
export type JRPCEngineEndCallback = (error?: Error) => void;

interface IdMapValue {
  req: JRPCRequest<unknown>;
  res: JRPCResponse<unknown>;
  next: JRPCEngineNextCallback;
  end: JRPCEngineEndCallback;
}

interface IdMap {
  [requestId: string]: IdMapValue;
}

export default function createStreamMiddleware() {
  const idMap: IdMap = {};

  function readNoop() {
    return false;
  }

  const events = new SafeEventEmitter();

  function processResponse(res: JRPCResponse<unknown>) {
    const context = idMap[(res.id as unknown) as string];
    if (!context) {
      throw new Error(`StreamMiddleware - Unknown response id "${res.id}"`);
    }

    delete idMap[(res.id as unknown) as string];
    // copy whole res onto original res
    Object.assign(context.res, res);
    // run callback on empty stack,
    // prevent internal stream-handler from catching errors
    setTimeout(context.end);
  }

  function processNotification(res: JRPCRequest<unknown>) {
    events.emit("notification", res);
  }

  function processMessage(res: JRPCResponse<unknown>, _encoding: unknown, cb: (error?: Error | null) => void) {
    let err;
    try {
      const isNotification = !res.id;
      if (isNotification) {
        processNotification((res as unknown) as JRPCRequest<unknown>);
      } else {
        processResponse(res);
      }
    } catch (_err) {
      err = _err;
    }
    // continue processing stream
    cb(err);
  }

  const stream = new Duplex({
    objectMode: true,
    read: readNoop,
    write: processMessage,
  });

  const middleware: JsonRpcMiddleware<unknown, unknown> = (req, res, next, end) => {
    // write req to stream
    stream.push(req);
    // register request on id map
    idMap[(req.id as unknown) as string] = { req, res, next, end };
  };

  return { events, middleware, stream };
}
