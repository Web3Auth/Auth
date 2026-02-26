import { getUniqueId } from "../../utils";
import { serializeJrpcError } from "../errors";
import { JRPCParams, JRPCRequest, JRPCResponse, Json, RequestArguments } from "../interfaces";
import { ProviderEvents, SafeEventEmitterProvider } from "../jrpcEngine";
import { SafeEventEmitter } from "../safeEventEmitter";
import { deepClone, propagateToRequest } from "./compatibility-utils";
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
      .then((result) => callback(null, { id: req.id, jsonrpc: "2.0", result: result as U }))
      .catch((error) => {
        const serializedError = serializeJrpcError(error, {
          shouldIncludeStack: false,
          shouldPreserveMessage: true,
        });
        callback(error, { id: req.id, jsonrpc: "2.0", error: serializedError });
      });
  };

  provider.request = async <T extends JRPCParams, U>(args: RequestArguments<T>) => {
    const req: JRPCRequest<JRPCParams> = {
      ...args,
      id: getUniqueId(),
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
  return async ({ request, context }) => {
    const providerRequest = deepClone(request);
    propagateToRequest(providerRequest, context);
    return (await provider.sendAsync(providerRequest)) as Json;
  };
}
