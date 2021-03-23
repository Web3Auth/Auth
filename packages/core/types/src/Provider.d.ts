import { JRPCEngine, JRPCRequest, ObjectMultiplex, PostMessageStream, SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
export default class Provider extends SafeEventEmitter {
    iframeElem: HTMLIFrameElement | null;
    rpcStream: PostMessageStream;
    rpcEngine: JRPCEngine;
    initialized: boolean;
    mux: ObjectMultiplex;
    init({ iframeUrl }: {
        iframeUrl: string;
    }): Promise<void>;
    initIFrame(src: string): Promise<void>;
    setupStream(): Promise<void>;
    cleanup(): Promise<void>;
    _rpcRequest(payload: JRPCRequest<unknown>, callback: (...args: any[]) => void): void;
}
