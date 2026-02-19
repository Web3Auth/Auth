import jsonStableStringify from "json-stable-stringify";

import { JRPCBase, JRPCFailure, JRPCNotification, JRPCParams, JRPCRequest, JRPCSuccess, Json } from "../jrpc/interfaces";
import { hasProperty, isObject } from "./utils";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type DeferredPromise<Type> = {
  promise: Promise<Type>;
  resolve: (value: Type) => void;
  reject: (error: unknown) => void;
};

// ─── JSON Utilities ─────────────────────────────────────────────────────────────

/**
 * Validates that a value is JSON-serializable.
 *
 * @param value - The value to validate.
 * @returns Whether the value is valid JSON.
 */
export function isValidJson(value: unknown): value is Json {
  if (value === null) {
    return true;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((entry) => isValidJson(entry));
  }
  if (isObject(value)) {
    return Object.values(value).every((entry) => isValidJson(entry));
  }
  return false;
}

/**
 * JSON-stringifies a value with 2-space indentation.
 *
 * @param value - The value to stringify.
 * @returns The stringified value.
 */
export function stringify(value: unknown): string {
  return jsonStableStringify(value, { space: 2 });
}

// ─── JRPC Type Guards ───────────────────────────────────────────────────────────

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
 * V2-compatible type guard to check if a JSON-RPC message is a request (has `id` property).
 * Unlike {@link isJRPCRequest}, this also accepts `Readonly<>` wrapped messages.
 */
export function isRequest<Params extends JRPCParams>(
  message: (JRPCNotification<Params> | JRPCRequest<Params>) | Readonly<JRPCNotification<Params> | JRPCRequest<Params>>
): message is JRPCRequest<Params> {
  return hasProperty(message, "id");
}

/**
 * V2-compatible type guard to check if a JSON-RPC message is a notification (no `id` property).
 * Unlike {@link isJRPCNotification}, this does NOT treat `{ id: undefined }` as a notification.
 */
export function isNotification<Params extends JRPCParams>(
  message: JRPCNotification<Params> | JRPCRequest<Params>
): message is JRPCNotification<Params> {
  return !isRequest(message);
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

// ─── Instance Checks ────────────────────────────────────────────────────────────

/**
 * The implementation of static `isInstance` methods for classes that have them.
 *
 * @param value - The value to check.
 * @param symbol - The symbol property to check for.
 * @returns Whether the value has `{ [symbol]: true }` in its prototype chain.
 */
export function isInstance(value: unknown, symbol: symbol): value is { [key: symbol]: true } {
  return isObject(value) && symbol in value && value[symbol] === true;
}

// ─── Unique ID ──────────────────────────────────────────────────────────────────

// uint32 (two's complement) max
// more conservative than Number.MAX_SAFE_INTEGER
const MAX = 4_294_967_295;
let idCounter = Math.floor(Math.random() * MAX);

/**
 * Gets an ID that is guaranteed to be unique so long as no more than
 * 4_294_967_295 (uint32 max) IDs are created, or the IDs are rapidly turned
 * over.
 *
 * @returns The unique ID.
 */
export function getUniqueId(): number {
  idCounter = (idCounter + 1) % MAX;
  return idCounter;
}

// ─── Iterable / Entry Helpers ───────────────────────────────────────────────────

/**
 * {@link Iterable} type guard.
 *
 * @param value - The value to check.
 * @returns Whether the value is an {@link Iterable}.
 */
export function isIterable(value: Iterable<unknown> | Record<PropertyKey, unknown>): value is Iterable<unknown> {
  return Symbol.iterator in value;
}

/**
 * Like Object.entries(), but includes symbol-keyed properties.
 *
 * @template KeyValues - The type of the keys and values in the object.
 * @param keyValues - The object to convert.
 * @returns The array of entries, including symbol-keyed properties.
 */
export function entriesFromKeyValues<KeyValues extends Record<PropertyKey, unknown>>(
  keyValues: KeyValues
): [keyof KeyValues, KeyValues[keyof KeyValues]][] {
  return Reflect.ownKeys(keyValues).map((key: keyof KeyValues) => [key, keyValues[key]]);
}
