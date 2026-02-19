import { entriesFromKeyValues, isInstance, isIterable } from "../../utils/jrpc";

const MiddlewareContextSymbol = Symbol.for("json-rpc-engine#MiddlewareContext");

/**
 * A context object for middleware that attempts to protect against accidental
 * modifications. Its interface is frozen.
 *
 * Map keys may not be directly overridden with {@link set}. Instead, use
 * {@link delete} to remove a key and then {@link set} to add a new value.
 *
 * The override protections are circumvented when using e.g. `Reflect.set`, so
 * don't do that.
 *
 * @template KeyValues - The type of the keys and values in the context.
 * @example
 * // By default, the context permits any PropertyKey as a key.
 * const context = new MiddlewareContext();
 * context.set('foo', 'bar');
 * context.get('foo'); // 'bar'
 * context.get('fizz'); // undefined
 * @example
 * // By specifying an object type, the context permits only the keys of the object.
 * type Context = MiddlewareContext<{ foo: string }>;
 * const context = new Context([['foo', 'bar']]);
 * context.get('foo'); // 'bar'
 * context.get('fizz'); // Type error
 */
export class MiddlewareContext<KeyValues extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>> extends Map<
  keyof KeyValues,
  KeyValues[keyof KeyValues]
> {
  // @ts-expect-error - TS6133: read via Symbol key in isInstance()
  private readonly [MiddlewareContextSymbol] = true;

  constructor(entries?: Iterable<readonly [keyof KeyValues, KeyValues[keyof KeyValues]]> | KeyValues) {
    super(entries && isIterable(entries) ? entries : entriesFromKeyValues(entries ?? {}));
    Object.freeze(this);
  }

  /**
   * Check if a value is a {@link MiddlewareContext} instance.
   * Works across different package versions in the same realm.
   *
   * @param value - The value to check.
   * @returns Whether the value is a {@link MiddlewareContext} instance.
   */
  static isInstance(value: unknown): value is MiddlewareContext {
    return isInstance(value, MiddlewareContextSymbol);
  }

  get<Key extends keyof KeyValues>(key: Key): KeyValues[Key] | undefined {
    return super.get(key) as KeyValues[Key] | undefined;
  }

  /**
   * Get a value from the context. Throws if the key is not found.
   *
   * @param key - The key to get the value for.
   * @returns The value.
   */
  assertGet<Key extends keyof KeyValues>(key: Key): KeyValues[Key] {
    if (!super.has(key)) {
      throw new Error(`Context key "${String(key)}" not found`);
    }
    return super.get(key) as KeyValues[Key];
  }

  /**
   * Set a value in the context. Throws if the key already exists.
   * {@link delete} an existing key before setting it to a new value.
   *
   * @throws If the key already exists.
   * @param key - The key to set the value for.
   * @param value - The value to set.
   * @returns The context.
   */
  set<Key extends keyof KeyValues>(key: Key, value: KeyValues[Key]): this {
    if (super.has(key)) {
      throw new Error(`MiddlewareContext key "${String(key)}" already exists`);
    }
    super.set(key, value);
    return this;
  }
}
