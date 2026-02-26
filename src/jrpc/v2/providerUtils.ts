import { JRPCParams, JRPCRequest, JRPCResponse, Json, RequestArguments } from "../interfaces";
import { ProviderEvents, SafeEventEmitterProvider } from "../jrpcEngine";
import { SafeEventEmitter } from "../safeEventEmitter";
import { JRPCEngineV2 } from "./jrpcEngineV2";
import type { JRPCMiddlewareV2 } from "./v2interfaces";

/**
 * Create a {@link SafeEventEmitterProvider} from a {@link JRPCEngineV2}.
 *
 * Unlike the V1 counterpart, the V2 engine throws errors directly rather than
 * wrapping them in response objects, so `sendAsync` simply propagates thrown errors.
 * Notification forwarding is not supported since {@link JRPCEngineV2} is not an event emitter.
 *
 * @param engine - The V2 JSON-RPC engine.
 * @returns A provider backed by the engine.
 */
export function providerFromEngine(engine: JRPCEngineV2): SafeEventEmitterProvider {
  const provider: SafeEventEmitterProvider = new SafeEventEmitter<ProviderEvents>() as SafeEventEmitterProvider;

  provider.sendAsync = async <T extends JRPCParams, U>(req: JRPCRequest<T>) => {
    const result = await engine.handle(req as JRPCRequest);
    return result as U;
  };

  provider.send = <T extends JRPCParams, U>(req: JRPCRequest<T>, callback: (error: unknown, providerRes: JRPCResponse<U>) => void) => {
    if (typeof callback !== "function") {
      throw new Error('Must provide callback to "send" method.');
    }
    engine
      .handle(req as JRPCRequest)
      // The callback is called in a setTimeout to ensure that it's being called only once.
      // Ref: https://github.com/eslint-community/eslint-plugin-promise/blob/main/docs/rules/no-callback-in-promise.md
      .then((result) => setTimeout(() => callback(null, { id: req.id, jsonrpc: "2.0", result: result as U }), 0))
      .catch((error) => setTimeout(() => callback(error, { id: req.id, jsonrpc: "2.0", error }), 0));
  };

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
 * Create a {@link SafeEventEmitterProvider} from one or more V2 middleware.
 *
 * @param middleware - The V2 middleware to back the provider.
 * @returns A provider backed by an engine composed of the given middleware.
 */
export function providerFromMiddleware(middleware: JRPCMiddlewareV2): SafeEventEmitterProvider {
  const engine = JRPCEngineV2.create({ middleware: [middleware] });
  return providerFromEngine(engine as JRPCEngineV2);
}

/**
 * Convert a {@link SafeEventEmitterProvider} into a V2 middleware.
 * The middleware delegates all requests to the provider's `sendAsync` method.
 *
 * @param provider - The provider to wrap as middleware.
 * @returns A V2 middleware that forwards requests to the provider.
 */
export function providerAsMiddleware(provider: SafeEventEmitterProvider): JRPCMiddlewareV2<JRPCRequest, Json> {
  return async ({ request }) => {
    return (await provider.sendAsync(request)) as Json;
  };
}
