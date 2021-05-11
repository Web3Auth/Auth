import { randomId } from "@toruslabs/openlogin-utils";
import { Duplex } from "stream";

import SafeEventEmitter from "./safeEventEmitter";
import SerializableError from "./serializableError";

export type Json = boolean | number | string | null | { [property: string]: Json } | Json[];

export type JRPCVersion = "2.0";
export type JRPCId = number | string | void;

export type ConsoleLike = Pick<Console, "log" | "warn" | "error" | "debug" | "info" | "trace">;
export interface JRPCBase {
  jsonrpc?: JRPCVersion;
  id?: JRPCId;
}

export function serializeError(error: Error | SerializableError<any>): string {
  return error.toString();
}
export interface JRPCResponse<T> extends JRPCBase {
  result?: T;
  error?: any;
}

export const getRpcPromiseCallback =
  (resolve: (value?: any) => void, reject: (error?: Error) => void, unwrapResult = true) =>
  (error: Error, response: JRPCResponse<unknown>): void => {
    if (error || response.error) {
      reject(error || response.error);
    } else if (!unwrapResult || Array.isArray(response)) {
      resolve(response);
    } else {
      resolve(response.result);
    }
  };

export interface JRPCRequest<T> extends JRPCBase {
  method: string;
  params?: T;
}

export type JRPCEngineNextCallback = (cb?: (done: (error?: Error) => void) => void) => void;
export type JRPCEngineEndCallback = (error?: Error) => void;
export type JRPCEngineReturnHandler = (done: (error?: Error) => void) => void;

interface IdMapValue {
  req: JRPCRequest<unknown>;
  res: JRPCResponse<unknown>;
  next: JRPCEngineNextCallback;
  end: JRPCEngineEndCallback;
}

interface IdMap {
  [requestId: string]: IdMapValue;
}

export type JRPCMiddleware<T, U> = (req: JRPCRequest<T>, res: JRPCResponse<U>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;

export function createErrorMiddleware(log: ConsoleLike): JRPCMiddleware<unknown, unknown> {
  return (req, res, next, end) => {
    try {
      // json-rpc-engine will terminate the request when it notices this error
      if (typeof req.method !== "string" || !req.method) {
        res.error = new SerializableError({ code: -32603, message: "invalid method" });
        end();
        return;
      }
      next((done) => {
        const { error } = res;
        if (!error) {
          return done();
        }
        log.error(`OpenLogin - RPC Error: ${error.message}`, error);
        return done();
      });
    } catch (error) {
      log.error(`OpenLogin - RPC Error thrown: ${error.message}`, error);
      res.error = new SerializableError({ code: -32603, message: error.message });
      end();
    }
  };
}

export function createStreamMiddleware(): { events: SafeEventEmitter; middleware: JRPCMiddleware<unknown, unknown>; stream: Duplex } {
  const idMap: IdMap = {};

  function readNoop() {
    return false;
  }

  const events = new SafeEventEmitter();

  function processResponse(res: JRPCResponse<unknown>) {
    const context = idMap[res.id as unknown as string];
    if (!context) {
      throw new Error(`StreamMiddleware - Unknown response id "${res.id}"`);
    }

    delete idMap[res.id as unknown as string];
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
        processNotification(res as unknown as JRPCRequest<unknown>);
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

  const middleware: JRPCMiddleware<unknown, unknown> = (req, res, next, end) => {
    // write req to stream
    stream.push(req);
    // register request on id map
    idMap[req.id as unknown as string] = { req, res, next, end };
  };

  return { events, middleware, stream };
}

type ScaffoldMiddlewareHandler<T, U> = JRPCMiddleware<T, U> | Json;

export function createScaffoldMiddleware(handlers: {
  [methodName: string]: ScaffoldMiddlewareHandler<unknown, unknown>;
}): JRPCMiddleware<unknown, unknown> {
  return (req, res, next, end) => {
    const handler = handlers[req.method];
    // if no handler, return
    if (handler === undefined) {
      return next();
    }
    // if handler is fn, call as middleware
    if (typeof handler === "function") {
      return handler(req, res, next, end);
    }
    // if handler is some other value, use as result
    res.result = handler;
    return end();
  };
}

export function createIdRemapMiddleware(): JRPCMiddleware<unknown, unknown> {
  return (req, res, next, _end) => {
    const originalId = req.id;
    const newId = randomId();
    req.id = newId;
    res.id = newId;
    next((done) => {
      req.id = originalId;
      res.id = originalId;
      done();
    });
  };
}

export function createLoggerMiddleware(logger: ConsoleLike): JRPCMiddleware<unknown, unknown> {
  return (req, res, next, _) => {
    logger.debug("REQ", req, "RES", res);
    next();
  };
}
