import { JRPCRequest, JsonRpcEngine, ObjectMultiplex, PostMessageStream, SafeEventEmitter } from "@openlogin/jrpc";
export declare class Provider extends SafeEventEmitter {
    iframeElem: HTMLIFrameElement | null;
    rpcStream: PostMessageStream;
    rpcEngine: JsonRpcEngine;
    initialized: boolean;
    mux: ObjectMultiplex;
    init({ iframeURL }: {
        iframeURL: string;
    }): Promise<void>;
    initIFrame(src: string): Promise<void>;
    setupStream(): Promise<void>;
    cleanup(): Promise<void>;
    _rpcRequest(payload: JRPCRequest<unknown>, callback: (...args: any[]) => void): void;
}
