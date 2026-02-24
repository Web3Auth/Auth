import deepFreeze from "deep-freeze-strict";

import { hasProperty } from "../../utils";
import { isNotification, isRequest, stringify } from "../../utils/jrpc";
import { JRPCNotification, JRPCRequest } from "../interfaces";
import { MiddlewareContext } from "./MiddlewareContext";
import type {
  ConstructorOptions,
  ContextConstraint,
  HandleOptions,
  InferKeyValues,
  InvalidEngine,
  JRPCMiddlewareV2,
  JsonRpcCall,
  MergedContextOf,
  MixedParam,
  Next,
  RequestOf,
  RequestState,
  ResultConstraint,
  WithoutId,
} from "./v2interfaces";
import { JsonRpcEngineError } from "./v2utils";

/**
 * A JSON-RPC request and response processor.
 *
 * Give it a stack of middleware, pass it requests, and get back responses.
 *
 * #### Requests vs. notifications
 *
 * JSON-RPC requests come in two flavors:
 *
 * - [Requests](https://www.jsonrpc.org/specification#request_object), i.e. request objects _with_ an `id`
 * - [Notifications](https://www.jsonrpc.org/specification#notification), i.e. request objects _without_ an `id`
 *
 * For requests, one of the engine's middleware must "end" the request by returning a non-`undefined` result,
 * or {@link handle} will throw an error:
 *
 * For notifications, on the other hand, one of the engine's middleware must return `undefined` to end the request,
 * and any non-`undefined` return values will cause an error:
 *
 * @template Request - The type of request to handle.
 * @template Result - The type of result to return.
 *
 * @example
 * ```ts
 * const engine = JRPCEngineV2.create({
 *   middleware,
 * });
 *
 * try {
 *   const result = await engine.handle(request);
 *   // Handle result
 * } catch (error) {
 *   // Handle error
 * }
 * ```
 */
export class JRPCEngineV2<Request extends JsonRpcCall = JsonRpcCall, Context extends ContextConstraint = MiddlewareContext> {
  #middleware: ReadonlyArray<JRPCMiddlewareV2<Request, ResultConstraint<Request>, Context>>;

  #isDestroyed = false;

  // See .create() for why this is private.

  private constructor({ middleware }: ConstructorOptions<Request, Context>) {
    this.#middleware = [...middleware];
  }

  // We use a static factory method in order to construct a supertype of all middleware contexts,
  // which enables us to instantiate an engine despite different middleware expecting different
  // context types.
  /**
   * Create a new JSON-RPC engine.
   *
   * @throws If the middleware array is empty.
   * @param options - The options for the engine.
   * @param middleware - The middleware to use.
   * @returns The JSON-RPC engine.
   */
  static create<
    Middleware extends JRPCMiddlewareV2<
      // Non-polluting `any` constraint.
      /* eslint-disable @typescript-eslint/no-explicit-any */
      any,
      ResultConstraint<any>,
      any
      /* eslint-enable @typescript-eslint/no-explicit-any */
    > = JRPCMiddlewareV2,
  >({
    middleware,
  }: {
    middleware: Middleware[];
  }): MergedContextOf<Middleware> extends never
    ? InvalidEngine<"Some middleware have incompatible context types">
    : JRPCEngineV2<RequestOf<Middleware>, MergedContextOf<Middleware>> {
    // We can't use NonEmptyArray for the params because it ruins type inference.
    if (middleware.length === 0) {
      throw new JsonRpcEngineError("Middleware array cannot be empty");
    }

    type MergedContext = MergedContextOf<Middleware>;
    type InputRequest = RequestOf<Middleware>;
    const mw = middleware as unknown as JRPCMiddlewareV2<InputRequest, ResultConstraint<InputRequest>, MergedContext>[];

    return new JRPCEngineV2<InputRequest, MergedContext>({
      middleware: mw,
    }) as MergedContext extends never ? InvalidEngine<"Some middleware have incompatible context types"> : JRPCEngineV2<InputRequest, MergedContext>;
  }

  /**
   * Handle a JSON-RPC request.
   *
   * @param request - The JSON-RPC request to handle.
   * @param options - The options for the handle operation.
   * @param options.context - The context to pass to the middleware.
   * @returns The JSON-RPC response.
   */
  async handle(
    request: Extract<Request, JRPCRequest> extends never ? never : Extract<Request, JRPCRequest>,
    options?: HandleOptions<Context>
  ): Promise<Extract<Request, JRPCRequest> extends never ? never : ResultConstraint<Request>>;

  /**
   * Handle a JSON-RPC notification. Notifications do not return a result.
   *
   * @param notification - The JSON-RPC notification to handle.
   * @param options - The options for the handle operation.
   * @param options.context - The context to pass to the middleware.
   */
  async handle(
    notification: Extract<Request, JRPCNotification> extends never ? never : WithoutId<Extract<Request, JRPCNotification>>,
    options?: HandleOptions<Context>
  ): Promise<Extract<Request, JRPCNotification> extends never ? never : ResultConstraint<Request>>;

  /**
   * Handle a JSON-RPC call, i.e. request or notification. Requests return a
   * result, notifications do not.
   *
   * @param call - The JSON-RPC call to handle.
   * @param options - The options for the handle operation.
   * @param options.context - The context to pass to the middleware.
   * @returns The JSON-RPC response, or `undefined` if the call is a notification.
   */
  async handle(call: MixedParam<Request>, options?: HandleOptions<Context>): Promise<ResultConstraint<Request> | void>;

  async handle(request: Request, { context }: HandleOptions<Context> = {}): Promise<Readonly<ResultConstraint<Request>> | void> {
    const isReq = isRequest(request);
    const { result } = await this._handle(request, context);

    if (isReq && result === undefined) {
      throw new JsonRpcEngineError(`Nothing ended request: ${stringify(request)}`);
    }
    return result;
  }

  /**
   * Convert the engine into a JSON-RPC middleware.
   *
   * @returns The JSON-RPC middleware.
   */
  asMiddleware(): JRPCMiddlewareV2<Request, ResultConstraint<Request>, Context> {
    this._assertIsNotDestroyed();

    return async ({ request, context, next }) => {
      const { result, request: finalRequest } = await this._handle(request, context);

      // We can't use nullish coalescing here because `result` may be `null`.

      return result === undefined ? await next(finalRequest) : result;
    };
  }

  /**
   * Destroy the engine. Calls the `destroy()` method of any middleware that has
   * one. Attempting to use the engine after destroying it will throw an error.
   */
  async destroy(): Promise<void> {
    if (this.#isDestroyed) {
      return;
    }
    this.#isDestroyed = true;

    const destructionPromise = Promise.all(
      this.#middleware.map(async (middleware) => {
        if (
          // Intentionally using `in` to walk the prototype chain.
          "destroy" in middleware &&
          typeof middleware.destroy === "function"
        ) {
          return middleware.destroy();
        }
        return undefined;
      })
    );
    this.#middleware = [] as never;
    await destructionPromise;
  }

  /**
   * Handle a JSON-RPC request. Throws if a middleware performs an invalid
   * operation. Permits returning an `undefined` result.
   *
   * @param originalRequest - The JSON-RPC request to handle.
   * @param rawContext - The context to pass to the middleware.
   * @returns The result from the middleware.
   */
  async _handle(
    originalRequest: Request,
    rawContext: Context | InferKeyValues<Context> = new MiddlewareContext() as Context
  ): Promise<RequestState<Request>> {
    this._assertIsNotDestroyed();

    deepFreeze(originalRequest);

    const state: RequestState<Request> = {
      request: originalRequest,
      result: undefined,
    };
    const middlewareIterator = this._makeMiddlewareIterator();
    const firstMiddleware = middlewareIterator.next().value;
    const context = MiddlewareContext.isInstance(rawContext) ? rawContext : (new MiddlewareContext(rawContext) as Context);

    const makeNext = this._makeNextFactory(middlewareIterator, state, context);

    const result = await firstMiddleware({
      request: originalRequest,
      context,
      next: makeNext(),
    });
    this._updateResult(result, state);

    return state;
  }

  /**
   * Create a factory of `next()` functions for use with a particular request.
   * The factory is recursive, and a new `next()` is created for each middleware
   * invocation.
   *
   * @param middlewareIterator - The iterator of middleware for the current
   * request.
   * @param state - The current values of the request and result.
   * @param context - The context to pass to the middleware.
   * @returns The `next()` function factory.
   */
  _makeNextFactory(
    middlewareIterator: Iterator<JRPCMiddlewareV2<Request, ResultConstraint<Request>, Context>>,
    state: RequestState<Request>,
    context: Context
  ): () => Next<Request> {
    const makeNext = (): Next<Request> => {
      let wasCalled = false;

      const next = async (request: Request = state.request): Promise<Readonly<ResultConstraint<Request>> | undefined> => {
        if (wasCalled) {
          throw new JsonRpcEngineError(`Middleware attempted to call next() multiple times for request: ${stringify(request)}`);
        }
        wasCalled = true;

        if (request !== state.request) {
          this._assertValidNextRequest(state.request, request);
          state.request = deepFreeze(request);
        }

        const { value: nextMiddleware, done } = middlewareIterator.next();
        if (done) {
          // This will cause the last middleware to return `undefined`. See the class
          // JSDoc or package README for more details.
          return undefined;
        }

        const result = await nextMiddleware({
          request,
          context,
          next: makeNext(),
        });
        this._updateResult(result, state);

        return state.result;
      };
      return next;
    };

    return makeNext;
  }

  _makeMiddlewareIterator(): Iterator<JRPCMiddlewareV2<Request, ResultConstraint<Request>, Context>> {
    return this.#middleware[Symbol.iterator]();
  }

  /**
   * Validate the result from a middleware and, if it's a new value, update the
   * current result.
   *
   * @param result - The result from the middleware.
   * @param state - The current values of the request and result.
   */
  _updateResult(result: Readonly<ResultConstraint<Request>> | ResultConstraint<Request> | void, state: RequestState<Request>): void {
    if (isNotification(state.request) && result !== undefined) {
      throw new JsonRpcEngineError(`Result returned for notification: ${stringify(state.request)}`);
    }

    if (result !== undefined && result !== state.result) {
      if (typeof result === "object" && result !== null) {
        deepFreeze(result);
      }
      state.result = result as Readonly<ResultConstraint<Request>>;
    }
  }

  /**
   * Assert that a request modified by a middleware is valid.
   *
   * @param currentRequest - The current request.
   * @param nextRequest - The next request.
   */
  _assertValidNextRequest(currentRequest: Request, nextRequest: Request): void {
    if (nextRequest.jsonrpc !== currentRequest.jsonrpc) {
      throw new JsonRpcEngineError(`Middleware attempted to modify readonly property "jsonrpc" for request: ${stringify(currentRequest)}`);
    }
    if (
      hasProperty(nextRequest, "id") !== hasProperty(currentRequest, "id") ||
      // "id" does not exist on notifications, but we can still
      // check the value of the property at runtime.
      (nextRequest as JRPCRequest).id !== (currentRequest as JRPCRequest).id
    ) {
      throw new JsonRpcEngineError(`Middleware attempted to modify readonly property "id" for request: ${stringify(currentRequest)}`);
    }
  }

  _assertIsNotDestroyed(): void {
    if (this.#isDestroyed) {
      throw new JsonRpcEngineError("Engine is destroyed");
    }
  }
}
