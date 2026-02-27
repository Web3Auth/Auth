import { Duplex } from "readable-stream";

import { isJRPCFailure, isJRPCSuccess, isValidMethod } from "../utils/jrpc";
import { log } from "../utils/logger";
import { errorCodes, JsonRpcError } from "./errors";
import { getMessageFromCode, isValidNumber, serializeJrpcError } from "./errors/utils";
import {
  JRPCEngineEndCallback,
  JRPCEngineNextCallback,
  JRPCEngineReturnHandler,
  JRPCError,
  JRPCMiddleware,
  JRPCParams,
  JRPCRequest,
  JRPCResponse,
  Maybe,
  RequestArguments,
  SendCallBack,
} from "./interfaces";
import { SafeEventEmitter } from "./safeEventEmitter";
import { SerializableError } from "./serializableError";

/**
 * @deprecated Use {@link JRPCEngineV2} instead, which does not extend EventEmitter.
 * Notifications should be handled via a separate {@link SafeEventEmitter}.
 */
export type JrpcEngineEvents = {
  notification: (...args: unknown[]) => void;
};

function constructFallbackError(error: Error): JRPCError {
  const {
    message = "",
    code = errorCodes.rpc.internal,
    stack = "Stack trace is not available.",
    data = "",
  } = error as { message?: string; code?: number; stack?: string; data?: string };
  const codeNumber = isValidNumber(code) ? parseInt(code.toString()) : errorCodes.rpc.internal;
  return {
    message: message || error?.toString() || getMessageFromCode(codeNumber),
    code: codeNumber,
    stack,
    data: data || message || error?.toString(),
  };
}

/**
 * A JSON-RPC request and response processor.
 * Give it a stack of middleware, pass it requests, and get back responses.
 *
 * @deprecated Use {@link JRPCEngineV2} instead. The V2 engine uses a functional
 * middleware signature, immutable requests, and a {@link MiddlewareContext} for
 * inter-middleware communication.
 */
export class JRPCEngine extends SafeEventEmitter<JrpcEngineEvents> {
  private _middleware: JRPCMiddleware<JRPCParams, unknown>[];

  constructor() {
    super();
    this._middleware = [];
  }

  /**
   * Serially executes the given stack of middleware.
   *
   * @returns An array of any error encountered during middleware execution,
   * a boolean indicating whether the request was completed, and an array of
   * middleware-defined return handlers.
   */
  private static async _runAllMiddleware(
    req: JRPCRequest,
    res: JRPCResponse<unknown>,
    middlewareStack: JRPCMiddleware<JRPCParams, unknown>[]
  ): Promise<
    [
      unknown, // error
      boolean, // isComplete
      JRPCEngineReturnHandler[],
    ]
  > {
    const returnHandlers: JRPCEngineReturnHandler[] = [];
    let error = null;
    let isComplete = false;

    // Go down stack of middleware, call and collect optional returnHandlers
    for (const middleware of middlewareStack) {
      [error, isComplete] = await JRPCEngine._runMiddleware(req, res, middleware, returnHandlers);
      if (isComplete) {
        break;
      }
    }
    return [error, isComplete, returnHandlers.reverse()];
  }

  /**
   * Runs an individual middleware.
   *
   * @returns An array of any error encountered during middleware execution,
   * and a boolean indicating whether the request should end.
   */
  private static _runMiddleware(
    req: JRPCRequest,
    res: JRPCResponse<unknown>,
    middleware: JRPCMiddleware<JRPCParams, unknown>,
    returnHandlers: JRPCEngineReturnHandler[]
  ): Promise<[unknown, boolean]> {
    return new Promise((resolve) => {
      const end: JRPCEngineEndCallback = (err?: unknown) => {
        const error = err || res.error;
        if (error) {
          if (typeof error === "object" && Object.keys(error).includes("stack") === false) error.stack = "Stack trace is not available.";
          log.error(error);

          res.error = serializeJrpcError(error, {
            shouldIncludeStack: true,
            fallbackError: constructFallbackError(error),
          });
        }
        // True indicates that the request should end
        resolve([error, true]);
      };

      const next: JRPCEngineNextCallback = (returnHandler?: JRPCEngineReturnHandler) => {
        if (res.error) {
          end(res.error);
        } else {
          if (returnHandler) {
            if (typeof returnHandler !== "function") {
              end(new SerializableError({ code: errorCodes.rpc.internal, message: "JRPCEngine: 'next' return handlers must be functions" }));
            }
            returnHandlers.push(returnHandler);
          }

          // False indicates that the request should not end
          resolve([null, false]);
        }
      };

      try {
        middleware(req, res, next, end);
      } catch (error: unknown) {
        end(error as Error);
      }
    });
  }

  /**
   * Serially executes array of return handlers. The request and response are
   * assumed to be in their scope.
   */
  private static async _runReturnHandlers(handlers: JRPCEngineReturnHandler[]): Promise<void> {
    for (const handler of handlers) {
      await new Promise<void>((resolve, reject) => {
        handler((err) => (err ? reject(err) : resolve()));
      });
    }
  }

  /**
   * Throws an error if the response has neither a result nor an error, or if
   * the "isComplete" flag is falsy.
   */
  private static _checkForCompletion(_req: JRPCRequest, res: JRPCResponse<unknown>, isComplete: boolean): void {
    if (!isJRPCSuccess(res) && !isJRPCFailure(res)) {
      throw new SerializableError({ code: errorCodes.rpc.internal, message: "Response has no error or result for request" });
    }
    if (!isComplete) {
      throw new SerializableError({ code: errorCodes.rpc.internal, message: "Nothing ended request" });
    }
  }

  /**
   * Add a middleware function to the engine's middleware stack.
   *
   * @param middleware - The middleware function to add.
   */
  push<T extends JRPCParams, U>(middleware: JRPCMiddleware<T, U>): void {
    this._middleware.push(middleware as JRPCMiddleware<JRPCParams, unknown>);
  }

  /**
   * Handle a JSON-RPC request, and return a response.
   *
   * @param request - The request to handle.
   * @param callback - An error-first callback that will receive the response.
   */
  handle<T extends JRPCParams, U>(request: JRPCRequest<T>, callback: (error: unknown, response: JRPCResponse<U>) => void): void;

  /**
   * Handle an array of JSON-RPC requests, and return an array of responses.
   *
   * @param request - The requests to handle.
   * @param callback - An error-first callback that will receive the array of
   * responses.
   */
  handle<T extends JRPCParams, U>(requests: JRPCRequest<T>[], callback: (error: unknown, responses: JRPCResponse<U>[]) => void): void;

  /**
   * Handle a JSON-RPC request, and return a response.
   *
   * @param request - The request to handle.
   * @returns A promise that resolves with the response, or rejects with an
   * error.
   */
  handle<T extends JRPCParams, U>(request: JRPCRequest<T>): Promise<JRPCResponse<U>>;

  /**
   * Handle an array of JSON-RPC requests, and return an array of responses.
   *
   * @param request - The requests to handle.
   * @returns A promise that resolves with the array of responses, or rejects
   * with an error.
   */
  handle<T extends JRPCParams, U>(requests: JRPCRequest<T>[]): Promise<JRPCResponse<U>[]>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handle(req: JRPCRequest | JRPCRequest[], cb?: any) {
    if (cb && typeof cb !== "function") {
      throw new Error('"callback" must be a function if provided.');
    }

    if (Array.isArray(req)) {
      if (cb) {
        return this._handleBatch(req, cb);
      }
      return this._handleBatch(req);
    }

    if (cb) {
      return this._handle(req, cb);
    }
    return this._promiseHandle(req);
  }

  /**
   * Returns this engine as a middleware function that can be pushed to other
   * engines.
   *
   * @returns This engine as a middleware function.
   */
  asMiddleware(): JRPCMiddleware<JRPCParams, unknown> {
    return async (req, res, next, end) => {
      try {
        const [middlewareError, isComplete, returnHandlers] = await JRPCEngine._runAllMiddleware(req, res, this._middleware);

        if (isComplete) {
          await JRPCEngine._runReturnHandlers(returnHandlers);
          return end(middlewareError as Error);
        }

        return next(async (handlerCallback) => {
          try {
            await JRPCEngine._runReturnHandlers(returnHandlers);
          } catch (error: unknown) {
            return handlerCallback(error as Error);
          }
          return handlerCallback();
        });
      } catch (error: unknown) {
        return end(error as Error);
      }
    };
  }

  /**
   * Like _handle, but for batch requests.
   */
  private _handleBatch(reqs: JRPCRequest[]): Promise<JRPCResponse<unknown>[]>;

  /**
   * Like _handle, but for batch requests.
   */
  private _handleBatch(reqs: JRPCRequest[], cb: (error: unknown, responses?: JRPCResponse<unknown>[]) => void): Promise<void>;

  private async _handleBatch(
    reqs: JRPCRequest[],
    cb?: (error: unknown, responses?: JRPCResponse<unknown>[]) => void
  ): Promise<JRPCResponse<unknown>[] | void> {
    // The order here is important
    try {
      if (reqs.length === 0) {
        const error = new SerializableError({
          code: errorCodes.rpc.invalidRequest,
          message: "Request batch must contain plain objects. Received an empty array",
        });
        const response: JRPCResponse<unknown>[] = [{ id: undefined, jsonrpc: "2.0" as const, error }];
        if (cb) {
          return cb(error, response);
        }
        return response;
      }
      // 2. Wait for all requests to finish, or throw on some kind of fatal
      // error
      const responses = (
        await Promise.all(
          // 1. Begin executing each request in the order received
          reqs.map(this._promiseHandle.bind(this))
        )
      ).filter((response): response is JRPCResponse<unknown> => response !== undefined);

      // 3. Return batch response
      if (cb) {
        return cb(null, responses);
      }
      return responses;
    } catch (error) {
      if (cb) {
        return cb(error);
      }

      throw error;
    }
  }

  /**
   * A promise-wrapped _handle.
   */
  private _promiseHandle(req: JRPCRequest): Promise<JRPCResponse<unknown>> {
    return new Promise((resolve, reject) => {
      this._handle(req, (_err, res) => {
        // There will always be a response, and it will always have any error
        // that is caught and propagated.
        if (_err && res === undefined) {
          reject(_err);
        } else resolve(res);
      }).catch(reject);
    });
  }

  /**
   * Ensures that the request object is valid, processes it, and passes any
   * error and the response object to the given callback.
   *
   * Does not reject.
   */
  private async _handle(callerReq: JRPCRequest, cb: (error: unknown, response: JRPCResponse<unknown>) => void): Promise<void> {
    if (!callerReq || Array.isArray(callerReq) || typeof callerReq !== "object") {
      const error = new SerializableError({
        code: errorCodes.rpc.invalidRequest,
        message: `Requests must be plain objects. Received: ${typeof callerReq}`,
      });
      return cb(error, { id: undefined, jsonrpc: "2.0", error });
    }

    if (!isValidMethod(callerReq)) {
      const error = new SerializableError({
        code: errorCodes.rpc.invalidRequest,
        message: `Must specify a string method. Received: ${typeof callerReq.method}`,
      });
      return cb(error, { id: callerReq.id, jsonrpc: "2.0", error });
    }

    const req: JRPCRequest = { ...callerReq };
    const res: JRPCResponse<unknown> = {
      id: req.id,
      jsonrpc: req.jsonrpc,
    };
    let error: Error = null;

    try {
      await this._processRequest(req, res);
    } catch (_error: unknown) {
      // A request handler error, a re-thrown middleware error, or something
      // unexpected.
      error = _error as Error;
    }

    if (error) {
      // Ensure no result is present on an errored response
      delete res.result;
      if (!res.error) {
        log.error(error);
        res.error = serializeJrpcError(error, {
          shouldIncludeStack: true,
          fallbackError: constructFallbackError(error),
        });
      }
    }

    return cb(error, res as JRPCResponse<unknown>);
  }

  /**
   * For the given request and response, runs all middleware and their return
   * handlers, if any, and ensures that internal request processing semantics
   * are satisfied.
   */
  private async _processRequest(req: JRPCRequest, res: JRPCResponse<unknown>): Promise<void> {
    const [error, isComplete, returnHandlers] = await JRPCEngine._runAllMiddleware(req, res, this._middleware);

    // Throw if "end" was not called, or if the response has neither a result
    // nor an error.
    JRPCEngine._checkForCompletion(req, res, isComplete);

    // The return handlers should run even if an error was encountered during
    // middleware processing.
    await JRPCEngine._runReturnHandlers(returnHandlers);

    // Now we re-throw the middleware processing error, if any, to catch it
    // further up the call chain.
    if (error) {
      throw error;
    }
  }
}

/**
 * @deprecated Use {@link JRPCEngineV2.create} with a middleware array instead.
 */
export function mergeMiddleware(middlewareStack: JRPCMiddleware<JRPCParams, unknown>[]): JRPCMiddleware<JRPCParams, unknown> {
  const engine = new JRPCEngine();
  middlewareStack.forEach((middleware) => {
    engine.push(middleware);
  });
  return engine.asMiddleware();
}

/**
 * @deprecated Use {@link createEngineStreamV2} instead.
 */
export interface EngineStreamOptions {
  engine: JRPCEngine;
}

/**
 * @deprecated Use {@link createEngineStreamV2} instead.
 */
export function createEngineStream(opts: EngineStreamOptions): Duplex {
  if (!opts || !opts.engine) {
    throw new Error("Missing engine parameter!");
  }

  const { engine } = opts;
  // eslint-disable-next-line prefer-const
  let stream: Duplex;

  function read(): undefined {
    return undefined;
  }

  function write(req: JRPCRequest, _encoding: unknown, cb: (error?: Error | null) => void) {
    engine.handle(req, (_err, res) => {
      stream.push(res);
    });
    cb();
  }

  stream = new Duplex({ objectMode: true, read, write });

  // forward notifications
  if (engine.on) {
    const onNotification = (message: unknown) => {
      stream.push(message);
    };

    // cleanup listener on stream close
    const cleanup = () => {
      engine.removeListener("notification", onNotification);
    };

    engine.on("notification", onNotification);
    stream.once("close", cleanup);
  }
  return stream;
}

/**
 * @deprecated Use {@link providerFromEngineV2} instead.
 */
export type ProviderEvents = {
  data: (error: unknown, message: unknown) => void;
};

/**
 * @deprecated Use {@link providerFromEngineV2} instead.
 */
export interface SafeEventEmitterProvider<E extends ProviderEvents = ProviderEvents> extends SafeEventEmitter<E> {
  sendAsync: <T extends JRPCParams, U>(req: JRPCRequest<T>) => Promise<U>;
  send: <T extends JRPCParams, U>(req: JRPCRequest<T>, callback: SendCallBack<JRPCResponse<U>>) => void;
  request: <T extends JRPCParams, U>(args: RequestArguments<T>) => Promise<Maybe<U>>;
}

/**
 * @deprecated Use {@link providerFromEngineV2} instead.
 */
export function providerFromEngine(engine: JRPCEngine): SafeEventEmitterProvider {
  const provider: SafeEventEmitterProvider = new SafeEventEmitter<ProviderEvents>() as SafeEventEmitterProvider;
  // handle both rpc send methods
  provider.sendAsync = async <T extends JRPCParams, U>(req: JRPCRequest<T>) => {
    const res = await engine.handle(req);
    if (res.error) {
      if (typeof res.error === "object" && Object.keys(res.error).includes("stack") === false) res.error.stack = "Stack trace is not available.";
      log.error(res.error);
      const err = serializeJrpcError(res.error, {
        fallbackError: constructFallbackError(res.error),
        shouldIncludeStack: true,
      });

      const errorCode = err?.code ?? errorCodes.rpc.internal;
      const error = new JsonRpcError(errorCode, err?.message ?? getMessageFromCode(errorCode), err?.data);
      throw error;
    }
    return res.result as U;
  };

  provider.send = <T extends JRPCParams, U>(req: JRPCRequest<T>, callback: (error: unknown, providerRes: JRPCResponse<U>) => void) => {
    if (typeof callback !== "function") {
      throw new Error('Must provide callback to "send" method.');
    }
    engine.handle(req as JRPCRequest<JRPCParams>, callback);
  };
  // forward notifications
  if (engine.on) {
    engine.on("notification", (message) => {
      provider.emit("data", null, message);
    });
  }

  provider.request = async <T extends JRPCParams, U>(args: RequestArguments<T>) => {
    const req: JRPCRequest<JRPCParams> = {
      ...args,
      id: Math.random().toString(36).slice(2),
      jsonrpc: "2.0",
    };
    const res = await provider.sendAsync(req);
    return res as U;
  };
  return provider;
}

/**
 * @deprecated Use {@link providerFromMiddlewareV2} instead.
 */
export function providerFromMiddleware(middleware: JRPCMiddleware<string[], unknown>): SafeEventEmitterProvider {
  const engine = new JRPCEngine();
  engine.push(middleware);
  const provider: SafeEventEmitterProvider = providerFromEngine(engine);
  return provider;
}

/**
 * @deprecated Use {@link providerAsMiddlewareV2} instead.
 */
export function providerAsMiddleware(provider: SafeEventEmitterProvider): JRPCMiddleware<JRPCParams, unknown> {
  return async (req, res, _next, end) => {
    // send request to provider
    try {
      const providerRes: unknown = await provider.sendAsync<JRPCParams, unknown>(req);
      res.result = providerRes;
      return end();
    } catch (error: unknown) {
      return end(error as Error);
    }
  };
}
