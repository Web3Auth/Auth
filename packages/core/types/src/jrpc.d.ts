export declare type JRPCVersion = "2.0";
export declare type JRPCId = number | string | void;
export interface JRPCBase {
    jsonrpc: JRPCVersion;
    id: JRPCId;
}
export interface JRPCResponse<T> extends JRPCBase {
    result?: T;
    error?: any;
}
export interface JRPCRequest<T> extends JRPCBase {
    method: string;
    params?: T;
}
export declare type JRPCMiddleware<T, U> = (req: JRPCRequest<T>, res: JRPCResponse<U>, next: any, end: any) => void;
