import { Duplex } from "readable-stream";

import { AsyncJRPCMiddleware, ConsoleLike, IdMap, JRPCMiddleware, JRPCRequest, JRPCResponse, Json, ReturnHandlerCallback } from "./interfaces";
import SafeEventEmitter from "./safeEventEmitter";
import SerializableError from "./serializableError";

export const getRpcPromiseCallback =
  (resolve: (value?: unknown) => void, reject: (error?: Error) => void, unwrapResult = true) =>
  (error: Error, response: JRPCResponse<unknown>): void => {
    if (error || response.error) {
      reject(error || response.error);
    } else if (!unwrapResult || Array.isArray(response)) {
      resolve(response);
    } else {
      resolve(response.result);
    }
  };

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
    } catch (error: unknown) {
      log.error(`OpenLogin - RPC Error thrown: ${(error as Error).message}`, error);
      res.error = new SerializableError({ code: -32603, message: (error as Error).message });
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
    let err: Error;
    try {
      const isNotification = !res.id;
      if (isNotification) {
        processNotification(res as unknown as JRPCRequest<unknown>);
      } else {
        processResponse(res);
      }
    } catch (_err: unknown) {
      err = _err as Error;
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

export type ScaffoldMiddlewareHandler<T, U> = JRPCMiddleware<T, U> | Json;

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
    const newId = Math.random().toString(36).slice(2);
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

export function createAsyncMiddleware<T, U>(asyncMiddleware: AsyncJRPCMiddleware<T, U>): JRPCMiddleware<T, U> {
  return async (req, res, next, end) => {
    // nextPromise is the key to the implementation
    // it is resolved by the return handler passed to the
    // "next" function
    let resolveNextPromise: () => void;
    const nextPromise = new Promise<void>((resolve) => {
      resolveNextPromise = resolve;
    });

    let returnHandlerCallback: unknown = null;
    let nextWasCalled = false;

    // This will be called by the consumer's async middleware.
    const asyncNext = async () => {
      nextWasCalled = true;

      // We pass a return handler to next(). When it is called by the engine,
      // the consumer's async middleware will resume executing.

      next((runReturnHandlersCallback) => {
        // This callback comes from JRPCEngine._runReturnHandlers
        returnHandlerCallback = runReturnHandlersCallback;
        resolveNextPromise();
      });
      await nextPromise;
    };

    try {
      await asyncMiddleware(req, res, asyncNext);

      if (nextWasCalled) {
        await nextPromise; // we must wait until the return handler is called
        (returnHandlerCallback as ReturnHandlerCallback)(null);
      } else {
        end(null);
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (returnHandlerCallback) {
        (returnHandlerCallback as ReturnHandlerCallback)(error);
      } else {
        end(error);
      }
    }
  };
}
