import { JRPCRequest, Json } from "../interfaces";
import type { ContextConstraint, JRPCMiddlewareV2, MiddlewareScaffold } from "./v2interfaces";

/**
 * Creates a middleware function from an object of RPC method handler functions,
 * keyed to particular method names. If a method corresponding to a key of this
 * object is requested, this middleware will pass it to the corresponding
 * handler and return the result.
 *
 * @param handlers - The RPC method handler functions.
 * @returns The scaffold middleware function.
 */
export function createScaffoldMiddleware<Context extends ContextConstraint>(
  handlers: MiddlewareScaffold<Context>
): JRPCMiddlewareV2<JRPCRequest, Json, Context> {
  return ({ request, context, next }) => {
    const handlerOrResult = handlers[request.method];
    if (handlerOrResult === undefined) {
      return next();
    }

    return typeof handlerOrResult === "function" ? handlerOrResult({ request, context, next }) : handlerOrResult;
  };
}
