export type Json = boolean | number | string | null | { [property: string]: Json } | Json[];

export type JRPCVersion = "2.0";
export type JRPCId = number | string | void;

export type ConsoleLike = Pick<Console, "log" | "warn" | "error" | "debug" | "info" | "trace">;
export interface JRPCBase {
  jsonrpc?: JRPCVersion;
  id?: JRPCId;
}

export interface JRPCResponse<T> extends JRPCBase {
  result?: T;
  error?: any;
}

export interface JRPCRequest<T> extends JRPCBase {
  method: string;
  params?: T;
}

export type JRPCEngineNextCallback = (cb?: (done: (error?: Error) => void) => void) => void;
export type JRPCEngineEndCallback = (error?: Error) => void;
export type JRPCEngineReturnHandler = (done: (error?: Error) => void) => void;

interface IdMapValue {
  req: JRPCRequest<unknown>;
  res: JRPCResponse<unknown>;
  next: JRPCEngineNextCallback;
  end: JRPCEngineEndCallback;
}

export interface IdMap {
  [requestId: string]: IdMapValue;
}

export type JRPCMiddleware<T, U> = (req: JRPCRequest<T>, res: JRPCResponse<U>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;

export type AsyncJRPCEngineNextCallback = () => Promise<void>;

export type Maybe<T> = T | Partial<T> | null | undefined;

export interface JRPCSuccess<T> extends JRPCBase {
  result: Maybe<T>;
}

export interface JRPCError {
  code: number;
  message: string;
  data?: unknown;
  stack?: string;
}

export interface PendingJRPCResponse<T> extends JRPCBase {
  result?: T;
  error?: Error | JRPCError;
}

export interface JRPCFailure extends JRPCBase {
  error: JRPCError;
}

export type AsyncJRPCMiddleware<T, U> = (req: JRPCRequest<T>, res: PendingJRPCResponse<U>, next: AsyncJRPCEngineNextCallback) => Promise<void>;

export type ReturnHandlerCallback = (error: null | Error) => void;

export type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";

export type BlockData = string | string[];

export type Block = Record<string, BlockData>;

export type SendAsyncCallBack = (err: Error, providerRes: JRPCResponse<Block>) => void;

export type SendCallBack<U> = (err: any, providerRes: U) => void;

export type Payload = Partial<JRPCRequest<string[]>>;

export interface RequestArguments<T> {
  method: string;
  params?: T;
}

export interface ExtendedJsonRpcRequest<T> extends JRPCRequest<T> {
  skipCache?: boolean;
}
