import { JRPCNotification, JRPCRequest } from "../src";
import { JsonRpcMiddlewareV2 } from "../src/jrpc/v2";
import { requestProps } from "../src/jrpc/v2/compatibility-utils";
import { DeferredPromise } from "../src/utils/jrpc";

const jsonrpc = "2.0" as const;

export const makeRequest = <Request extends JRPCRequest = JRPCRequest>(request: Partial<Request> = {}): JRPCRequest => ({
  jsonrpc,
  id: request.id ?? "1",
  method: request.method ?? "test_request",
  params: request.params ?? [],
});

export const makeNotification = <Request extends JRPCNotification = JRPCNotification>(params: Request = {} as Request): JRPCNotification => ({
  jsonrpc,
  method: "test_request",
  params: [],
  ...params,
});

/**
 * Creates a {@link JsonRpcCall} middleware that returns `null`.
 *
 * @returns The middleware.
 */
export const makeNullMiddleware = (): JsonRpcMiddlewareV2 => {
  const nullMiddleware: JsonRpcMiddlewareV2 = (): null => null;
  return nullMiddleware;
};

/**
 * Creates a {@link JRPCRequest} middleware that returns `null`.
 *
 * @returns The middleware.
 */
export const makeRequestMiddleware = (): JsonRpcMiddlewareV2<JRPCRequest> => {
  const requestMiddleware: JsonRpcMiddlewareV2<JRPCRequest> = (): null => null;
  return requestMiddleware;
};

/**
 * Creates a middleware that returns `undefined` (appropriate for notifications).
 *
 * @returns The middleware.
 */
export const makeNotificationMiddleware = (): JsonRpcMiddlewareV2 => {
  const notificationMiddleware: JsonRpcMiddlewareV2 = (): undefined => undefined;
  return notificationMiddleware;
};

/**
 * Get the keys of a request that are not part of the standard JSON-RPC request
 * properties.
 *
 * @param req - The request to get the extraneous keys from.
 * @returns The extraneous keys.
 */
export function getExtraneousKeys(req: Record<string, unknown>): string[] {
  return Object.keys(req).filter((key) => !requestProps.find((requestProp: string) => requestProp === key));
}

/**
 * Create a defered Promise.
 *
 * If the Promise is rejected prior to a handler being added, this can result in an
 * `UnhandledPromiseRejection` error. Optionally this can be suppressed with the
 * `suppressUnhandledRejection` flag, as it's common to belatedly handle deferred Promises, or to
 * ignore them if they're no longer relevant (e.g. related to a cancelled request).
 *
 * However, be very careful that you have handled the Promise if you do this. Suppressing these
 * errors is dangerous, they exist for good reason. An unhandled rejection can hide errors, making
 * debugging extremely difficult. They should only be suppressed if you're confident that the
 * Promise is always handled correctly, in both the success and failure cases.
 *
 * @param args - The arguments.
 * @param args.suppressUnhandledRejection - This option adds an empty error handler
 * to the Promise to suppress the UnhandledPromiseRejection error. This can be
 * useful if the deferred Promise is sometimes intentionally not used.
 * @returns A deferred Promise.
 * @template Result - The result type of the Promise.
 */
export function createDeferredPromise<Result = void>({
  suppressUnhandledRejection = false,
}: {
  suppressUnhandledRejection?: boolean;
} = {}): DeferredPromise<Result> {
  let resolve: DeferredPromise<Result>["resolve"];
  let reject: DeferredPromise<Result>["reject"];
  // eslint-disable-next-line promise/param-names
  const promise = new Promise<Result>((innerResolve: DeferredPromise<Result>["resolve"], innerReject: DeferredPromise<Result>["reject"]) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  if (suppressUnhandledRejection) {
    promise.catch((_error) => {
      // This handler is used to suppress the UnhandledPromiseRejection error
    });
  }

  return { promise, resolve, reject };
}
