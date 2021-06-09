import {
  createIdRemapMiddleware,
  createStreamMiddleware,
  JRPCEngine,
  JRPCRequest,
  ObjectMultiplex,
  PostMessageStream,
  SafeEventEmitter,
  setupMultiplex,
} from "@toruslabs/openlogin-jrpc";
import { randomId } from "@toruslabs/openlogin-utils";
import pump from "pump";

import { iframeDOMElementID } from "./constants";
import { documentReady } from "./utils";

export default class Provider extends SafeEventEmitter {
  iframeElem: HTMLIFrameElement | null = null;

  rpcStream: PostMessageStream;

  rpcEngine: JRPCEngine;

  initialized: boolean;

  mux: ObjectMultiplex;

  async init({ iframeUrl }: { iframeUrl: string }): Promise<void> {
    await this.initIFrame(iframeUrl);
    await this.setupStream();
    this.initialized = true;
  }

  async initIFrame(src: string): Promise<void> {
    await documentReady();
    const documentIFrameElem = document.getElementById(iframeDOMElementID) as HTMLIFrameElement;
    if (documentIFrameElem) {
      documentIFrameElem.remove();
      window.console.log("already initialized, removing previous provider iframe");
    }
    const iframeElem = document.createElement("iframe");
    iframeElem.src = src;
    iframeElem.id = iframeDOMElementID;
    iframeElem.setAttribute("style", "display:none; position:fixed; top: 0; left: 0; width: 100%");
    document.body.appendChild(iframeElem);
    this.iframeElem = iframeElem;
  }

  async setupStream(): Promise<void> {
    if (this.iframeElem === null) throw new Error("iframe is null");
    this.rpcStream = new PostMessageStream({
      name: "embed_rpc",
      target: "iframe_rpc",
      targetWindow: this.iframeElem.contentWindow,
    });

    this.mux = setupMultiplex(this.rpcStream);

    const JRPCConnection = createStreamMiddleware();
    pump(JRPCConnection.stream, this.mux.createStream("jrpc"), JRPCConnection.stream, (error) => {
      window.console.log(`JRPC connection broken`, error);
    });

    const rpcEngine = new JRPCEngine();
    rpcEngine.push(createIdRemapMiddleware());
    rpcEngine.push(JRPCConnection.middleware);
    this.rpcEngine = rpcEngine;
  }

  async cleanup(): Promise<void> {
    await documentReady();
    const documentIFrameElem = document.getElementById(iframeDOMElementID) as HTMLIFrameElement;
    if (documentIFrameElem) {
      documentIFrameElem.remove();
      this.iframeElem = null;
    }
    this.initialized = false;
  }

  _rpcRequest(payload: JRPCRequest<unknown>, callback: (...args: any[]) => void): void {
    if (!payload.jsonrpc) {
      payload.jsonrpc = "2.0";
    }
    if (!payload.id) {
      payload.id = randomId();
    }
    this.rpcEngine.handle(payload, callback);
  }
}
