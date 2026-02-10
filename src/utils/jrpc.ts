import { JRPCBase, JRPCFailure, JRPCNotification, JRPCParams, JRPCRequest, JRPCSuccess } from "../jrpc/interfaces";
import { hasProperty } from "./utils";

/**
 * Type guard to check if a JRPC message is a notification (no `id` property).
 */
export function isJRPCNotification<T extends JRPCParams>(request: JRPCNotification<T> | JRPCRequest<T>): request is JRPCNotification<T> {
  return !hasProperty(request, "id") || request.id === undefined;
}

/**
 * Type guard to check if a JRPC message is a request (has `id` property).
 */
export function isJRPCRequest<T extends JRPCParams>(request: JRPCNotification<T> | JRPCRequest<T>): request is JRPCRequest<T> {
  return hasProperty(request, "id") && request.id !== undefined;
}

/**
 * Checks whether the given request has a valid (non-empty string) `method`.
 */
export function isValidMethod(request: Partial<JRPCRequest>): boolean {
  return typeof request.method === "string" && request.method.length > 0;
}

/**
 * Type guard to check if a JRPC response is a success (has `result`).
 */
export function isJRPCSuccess<T>(response: JRPCBase): response is JRPCSuccess<T> {
  return "result" in response;
}

/**
 * Type guard to check if a JRPC response is a failure (has `error`).
 */
export function isJRPCFailure(response: JRPCBase): response is JRPCFailure {
  return "error" in response;
}
