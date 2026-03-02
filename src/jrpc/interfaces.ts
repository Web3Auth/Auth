/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json = boolean | number | string | null | { [property: string]: Json } | Json[];

export type JRPCVersion = "2.0";
export type JRPCId = number | string | void;

export type ConsoleLike = Pick<Console, "log" | "warn" | "error" | "debug" | "info" | "trace">;
export interface JRPCBase {
  jsonrpc?: JRPCVersion;
  id?: JRPCId;
}

// `unknown` is added for the backward compatibility.
// TODO: remove `unknown` after the backward compatibility is no longer needed.
export type JRPCParams = Json[] | Record<string, Json> | unknown;

export interface JRPCResponse<T> extends JRPCBase {
  result?: T;
  error?: any;
}

export interface JRPCNotification<Params extends JRPCParams = JRPCParams> {
  jsonrpc?: JRPCVersion;
  method: string;
  params?: Params;
}

export interface JRPCRequest<Params extends JRPCParams = JRPCParams> extends JRPCBase {
  id: JRPCId;
  method: string;
  params?: Params;
}

/**
 * @deprecated Part of the JRPC V1 middleware signature. Use {@link JRPCMiddlewareV2} instead.
 */
export type JRPCEngineNextCallback = (cb?: (done: (error?: Error) => void) => void) => void;
/**
 * @deprecated Part of the JRPC V1 middleware signature. Use {@link JRPCMiddlewareV2} instead.
 */
export type JRPCEngineEndCallback = (error?: Error) => void;
/**
 * @deprecated Part of the JRPC V1 middleware signature. Use {@link JRPCMiddlewareV2} instead.
 */
export type JRPCEngineReturnHandler = (done: (error?: Error) => void) => void;

/**
 * @deprecated Part of the JRPC V1 stream middleware. Use {@link createEngineStreamV2} instead.
 */
interface IdMapValue {
  req: JRPCRequest<JRPCParams>;
  res: JRPCResponse<unknown>;
  next: JRPCEngineNextCallback;
  end: JRPCEngineEndCallback;
}

/**
 * @deprecated Part of the JRPC V1 stream middleware. Use {@link createEngineStreamV2} instead.
 */
export interface IdMap {
  [requestId: string]: IdMapValue;
}

/**
 * @deprecated Use {@link JRPCMiddlewareV2} instead. V2 middleware receives a single
 * params object `{ request, context, next }` and returns the result directly.
 */
export type JRPCMiddleware<T extends JRPCParams = JRPCParams, U = unknown> = (
  req: JRPCRequest<T>,
  res: JRPCResponse<U>,
  next: JRPCEngineNextCallback,
  end: JRPCEngineEndCallback
) => void;

/**
 * @deprecated Use {@link JRPCMiddlewareV2} instead — V2 middleware is async by default.
 */
export type AsyncJRPCEngineNextCallback = () => Promise<void>;

export type Maybe<T> = T | Partial<T> | null | undefined;

export interface JRPCSuccess<T> extends JRPCBase {
  result: Maybe<T>;
}

/**
 * A data object, that must be either:
 *
 * - A JSON-serializable object.
 * - An object with a `cause` property that is an error-like value, and any
 * other properties that are JSON-serializable.
 */
export type DataWithOptionalCause =
  | Json
  | {
      // Unfortunately we can't use just `Json` here, because all properties of
      // an object with an index signature must be assignable to the index
      // signature's type. So we have to use `Json | unknown` instead.
      [key: string]: Json | unknown;
      cause?: unknown;
    };

/**
 * A data object, that must be either:
 *
 * - A valid DataWithOptionalCause value.
 * - undefined.
 */
export type OptionalDataWithOptionalCause = undefined | DataWithOptionalCause;

export interface JRPCError {
  code: number;
  message: string;
  data?: DataWithOptionalCause;
  stack?: string;
}

/**
 * @deprecated Part of the JRPC V1 API. V2 middleware returns results directly.
 */
export interface PendingJRPCResponse<T> extends JRPCBase {
  result?: T;
  error?: Error | JRPCError;
}

export interface JRPCFailure extends JRPCBase {
  error: JRPCError;
}

/**
 * @deprecated Use {@link JRPCMiddlewareV2} instead — V2 middleware is async by default.
 */
export type AsyncJRPCMiddleware<T extends JRPCParams, U> = (
  req: JRPCRequest<T>,
  res: PendingJRPCResponse<U>,
  next: AsyncJRPCEngineNextCallback
) => Promise<void>;

/**
 * @deprecated Part of the JRPC V1 middleware signature. Use {@link JRPCMiddlewareV2} instead.
 */
export type ReturnHandlerCallback = (error: null | Error) => void;

export type BlockData = string | string[];

export type Block = Record<string, BlockData>;

/**
 * @deprecated Part of the JRPC V1 provider API. Use {@link providerFromEngineV2} instead.
 */
export type SendAsyncCallBack = (err: Error, providerRes: JRPCResponse<Block>) => void;

/**
 * @deprecated Part of the JRPC V1 provider API. Use {@link providerFromEngineV2} instead.
 */
export type SendCallBack<U> = (err: any, providerRes: U) => void;

/**
 * @deprecated Part of the JRPC V1 API.
 */
export type Payload = Partial<JRPCRequest<string[]>>;

export interface RequestArguments<T> {
  method: string;
  params?: T;
}

/**
 * @deprecated Part of the JRPC V1 API.
 */
export interface ExtendedJsonRpcRequest<T extends JRPCParams> extends JRPCRequest<T> {
  skipCache?: boolean;
}
