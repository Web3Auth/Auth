import { hasProperty, isObject } from "../../utils/utils";
import { JRPCNotification, JRPCParams, JRPCRequest, Json } from "../interfaces";
import type { JsonRpcCall } from "./v2interfaces";

export type DeferredPromise<Type> = {
  promise: Promise<Type>;
  resolve: (value: Type) => void;
  reject: (error: unknown) => void;
};

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

export function isRequest<Params extends JRPCParams>(message: JsonRpcCall<Params> | Readonly<JsonRpcCall<Params>>): message is JRPCRequest<Params> {
  return hasProperty(message, "id");
}

export function isNotification<Params extends JRPCParams>(message: JsonRpcCall<Params>): message is JRPCNotification<Params> {
  return !isRequest(message);
}

/**
 * JSON-stringifies a value.
 *
 * @param value - The value to stringify.
 * @returns The stringified value.
 */
export function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

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

const JsonRpcEngineErrorSymbol = Symbol.for("json-rpc-engine#JsonRpcEngineError");

export class JsonRpcEngineError extends Error {
  // This is a computed property name, and it doesn't seem possible to make it
  // hash private using `#`.

  private readonly [JsonRpcEngineErrorSymbol] = true;

  constructor(message: string) {
    super(message);
    this.name = "JsonRpcEngineError";
  }

  /**
   * Check if a value is a {@link JsonRpcEngineError} instance.
   * Works across different package versions in the same realm.
   *
   * @param value - The value to check.
   * @returns Whether the value is a {@link JsonRpcEngineError} instance.
   */
  static isInstance(value: unknown): value is JsonRpcEngineError {
    return isInstance(value, JsonRpcEngineErrorSymbol);
  }
}

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
