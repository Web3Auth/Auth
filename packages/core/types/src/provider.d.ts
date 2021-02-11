import { PostMessageStream } from "./postMessageStream";
import SafeEventEmitter from "./safeEventEmitter";
export declare class Provider extends SafeEventEmitter {
    iframeElem: HTMLIFrameElement | null;
    rpcStream: PostMessageStream;
    initialized: boolean;
    init({ iframeURL }: {
        iframeURL: string;
    }): Promise<void>;
    initIFrame(src: string): Promise<void>;
    setupStream(): Promise<void>;
    cleanup(): Promise<void>;
}
