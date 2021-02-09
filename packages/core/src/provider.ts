import { iframeDOMElementID } from "./constants";
import { PostMessageStream } from "./postMessageStream";
import SafeEventEmitter from "./safeEventEmitter";
import { documentReady } from "./utils";

export class Provider extends SafeEventEmitter {
  iframeElem: HTMLIFrameElement | null = null;

  rpcStream: PostMessageStream;

  initialized: boolean;

  async init({ iframeURL }: { iframeURL: string }): Promise<void> {
    await this.initIFrame(iframeURL);
    await this.setupStream();
    this.initialized = true;
  }

  async initIFrame(src: string): Promise<void> {
    await documentReady();
    const documentIFrameElem = document.getElementById(iframeDOMElementID) as HTMLIFrameElement;
    if (documentIFrameElem) {
      throw new Error("already initialized");
    } else {
      const iframeElem = document.createElement("iframe");
      iframeElem.src = src;
      iframeElem.id = iframeDOMElementID;
      iframeElem.setAttribute("style", "display:none; position:fixed; top: 0; left: 0; width: 100%");
      document.appendChild(iframeElem);
      this.iframeElem = iframeElem;
    }
  }

  async setupStream(): Promise<void> {
    if (this.iframeElem === null) throw new Error("iframe is null");
    this.rpcStream = new PostMessageStream({
      name: `embed_rpc`,
      target: "iframe_rpc",
      targetWindow: this.iframeElem.contentWindow,
    });
  }

  async cleanup(): Promise<void> {
    this.iframeElem.remove();
    this.initialized = false;
  }

  // request(payload: JSONRPCRequestPayload, callback: (err: Error, result: JSONRPCRequestPayload) => void): void {}
}
