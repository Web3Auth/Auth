import { Duplex } from "readable-stream";
import { AsyncJRPCMiddleware, ConsoleLike, JRPCMiddleware, JRPCResponse, Json } from "./interfaces";
import SafeEventEmitter from "./safeEventEmitter";
export declare const getRpcPromiseCallback: (resolve: (value?: unknown) => void, reject: (error?: Error) => void, unwrapResult?: boolean) => (error: Error, response: JRPCResponse<unknown>) => void;
export declare function createErrorMiddleware(log: ConsoleLike): JRPCMiddleware<unknown, unknown>;
export declare function createStreamMiddleware(): {
    events: SafeEventEmitter;
    middleware: JRPCMiddleware<unknown, unknown>;
    stream: Duplex;
};
export type ScaffoldMiddlewareHandler<T, U> = JRPCMiddleware<T, U> | Json;
export declare function createScaffoldMiddleware(handlers: {
    [methodName: string]: ScaffoldMiddlewareHandler<unknown, unknown>;
}): JRPCMiddleware<unknown, unknown>;
export declare function createIdRemapMiddleware(): JRPCMiddleware<unknown, unknown>;
export declare function createLoggerMiddleware(logger: ConsoleLike): JRPCMiddleware<unknown, unknown>;
export declare function createAsyncMiddleware<T, U>(asyncMiddleware: AsyncJRPCMiddleware<T, U>): JRPCMiddleware<T, U>;
