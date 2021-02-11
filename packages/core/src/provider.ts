import { createIdRemapMiddleware, JsonRpcEngine, JsonRpcRequest } from "json-rpc-engine";
import pump from "pump";

import { iframeDOMElementID } from "./constants";
import createStreamMiddleware, { createErrorMiddleware, JRPCRequest } from "./jrpc";
import { ObjectMultiplex } from "./mux";
import { PostMessageStream } from "./postMessageStream";
import SafeEventEmitter from "./safeEventEmitter";
import { documentReady, randomId } from "./utils";

export class Provider extends SafeEventEmitter {
  iframeElem: HTMLIFrameElement | null = null;

  rpcStream: PostMessageStream;

  rpcEngine: JsonRpcEngine;

  initialized: boolean;

  mux: ObjectMultiplex;

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
      document.body.appendChild(iframeElem);
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

    this.mux = new ObjectMultiplex();
    pump(this.rpcStream, this.mux, this.rpcStream, (streamName, error) => {
      window.console.log(`${streamName} disconnected.`, error);
    });
    const JRPCConnection = createStreamMiddleware();
    pump(JRPCConnection.stream, this.mux.createStream("jrpc"), JRPCConnection.stream, (streamName, error) => {
      window.console.log(`JRPC connection broken`, error);
    });

    const rpcEngine = new JsonRpcEngine();
    rpcEngine.push(createIdRemapMiddleware());
    rpcEngine.push(createErrorMiddleware(window.console));
    rpcEngine.push(JRPCConnection.middleware);
    this.rpcEngine = rpcEngine;
  }

  async cleanup(): Promise<void> {
    this.iframeElem.remove();
    this.initialized = false;
  }

  _rpcRequest(payload: JRPCRequest<unknown>, callback: (...args: any[]) => void): void {
    if (!payload.jsonrpc) {
      payload.jsonrpc = "2.0";
    }
    if (!payload.id) {
      payload.id = randomId();
    }
    this.rpcEngine.handle(payload as JsonRpcRequest<unknown>, callback);
  }
}
