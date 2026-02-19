import { isInstance } from "../../utils/jrpc";

const JsonRpcEngineErrorSymbol = Symbol.for("json-rpc-engine#JsonRpcEngineError");

export class JsonRpcEngineError extends Error {
  // This is a computed property name, and it doesn't seem possible to make it
  // hash private using `#`.
  // Used by isInstance() via `in` operator at runtime.
  // @ts-expect-error - TS6133: read via Symbol key in isInstance()
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
