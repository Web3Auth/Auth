import { getRpcPromiseCallback, JRPCRequest, ObjectMultiplex, setupMultiplex } from "@openlogin/jrpc";

import { Provider } from "./provider";
import { Maybe } from "./utils";

type OpenLoginState = {
  iframeURL: string;
};

class OpenLogin {
  provider: Provider;

  state: OpenLoginState;

  rpcMux: ObjectMultiplex;

  constructor({ iframeURL }: { iframeURL: string }) {
    this.provider = new Proxy(new Provider(), {
      deleteProperty: () => true, // work around for web3
    });
    this.rpcMux = setupMultiplex(this.provider.rpcStream);
    this.state.iframeURL = iframeURL;
  }

  async init(): Promise<void> {
    await this.provider.init({ iframeURL: this.state.iframeURL });
  }

  async cleanup(): Promise<void> {
    await this.provider.cleanup();
  }

  async request<T, U>(args: JRPCRequest<T>): Promise<Maybe<U>> {
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      throw new Error("invalid request args");
    }

    const { method, params } = args;

    if (typeof method !== "string" || method.length === 0) {
      throw new Error("invalid request method");
    }

    if (params !== undefined && !Array.isArray(params) && (typeof params !== "object" || params === null)) {
      throw new Error("invalid request params");
    }

    return new Promise<T>((resolve, reject) => {
      this.provider._rpcRequest({ method, params }, getRpcPromiseCallback(resolve, reject));
    });
  }
}

export default OpenLogin;
