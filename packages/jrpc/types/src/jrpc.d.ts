/// <reference types="node" />
import { Duplex } from "stream";
import SafeEventEmitter from "./safeEventEmitter";
import SerializableError from "./serializableError";
export declare type JRPCVersion = "2.0";
export declare type JRPCId = number | string | void;
export declare type ConsoleLike = Pick<Console, "log" | "warn" | "error" | "debug" | "info" | "trace">;
export interface JRPCBase {
    jsonrpc?: JRPCVersion;
    id?: JRPCId;
}
export declare function serializeError(error: Error | SerializableError<any>): string;
export interface JRPCResponse<T> extends JRPCBase {
    result?: T;
    error?: any;
}
export declare const getRpcPromiseCallback: (resolve: (value?: any) => void, reject: (error?: Error) => void, unwrapResult?: boolean) => (error: Error, response: JRPCResponse<unknown>) => void;
export interface JRPCRequest<T> extends JRPCBase {
    method: string;
    params?: T;
}
export declare type JRPCEngineNextCallback = (cb?: (done: (error?: Error) => void) => void) => void;
export declare type JRPCEngineEndCallback = (error?: Error) => void;
export declare type JsonRpcEngineReturnHandler = (done: (error?: Error) => void) => void;
export declare type JRPCMiddleware<T, U> = (req: JRPCRequest<T>, res: JRPCResponse<U>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
export declare function createErrorMiddleware(log: ConsoleLike): JRPCMiddleware<unknown, unknown>;
export declare function createStreamMiddleware(): {
    events: SafeEventEmitter;
    middleware: JRPCMiddleware<unknown, unknown>;
    stream: Duplex;
};
export declare function createIdRemapMiddleware(): JRPCMiddleware<unknown, unknown>;
