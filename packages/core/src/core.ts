import { getRpcPromiseCallback, JRPCRequest, Json } from "@openlogin/jrpc";

import { Provider } from "./provider";
import OpenLoginStore from "./store";
import { constructURL, Maybe } from "./utils";

type LoginParams = {
  clientId?: string;
  redirectUrl?: string;
  loginProvider: string;
  fastLogin?: boolean;
};

interface OpenLoginState {
  iframeUrl: string;
  userProfile?: Json;
  loginDefaults: Partial<LoginParams>;
  store: OpenLoginStore;
}

type OpenLoginOptions = {
  clientId: string;
  iframeUrl: string;
};

class OpenLogin {
  provider: Provider;

  state: OpenLoginState;

  constructor(options: OpenLoginOptions) {
    this.provider = new Proxy(new Provider(), {
      deleteProperty: () => true, // work around for web3
    });
    this.initState(options);
  }

  initState(options: OpenLoginOptions): void {
    this.state = {
      iframeUrl: options.iframeUrl,
      loginDefaults: {
        clientId: options.clientId,
        redirectUrl: constructURL(options.iframeUrl, {}, { redirect: true }),
      },
      store: OpenLoginStore.getInstance(),
    };
  }

  async init(): Promise<void> {
    await this.provider.init({ iframeUrl: this.state.iframeUrl });
    this._syncState(await this._getIframeData());
    this._syncState(this._getHashQueryParams());
  }

  async login({ options, popup }: { options: LoginParams; popup: boolean }): Promise<void> {
    const loginURL = constructURL(this.state.iframeUrl, { ...options, ...this.state.loginDefaults });
    return this.open(loginURL, popup);
  }

  // eslint-disable-next-line class-methods-use-this
  async open(url: string, popup = false): Promise<void> {
    if (popup) {
      // TODO: implement popup flow
    } else {
      // TODO: implement redirect handling
      window.location.href = url;
    }
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

  _syncState(newState: Record<string, unknown>): void {
    this.state = { ...this.state, ...newState };
  }

  // eslint-disable-next-line class-methods-use-this
  _getHashQueryParams(): Record<string, unknown> {
    const url = new URL(window.location.href);
    const params: Record<string, unknown> = {};
    url.searchParams.forEach((value, key) => {
      params[value] = key;
    });
    return params;
  }

  async _getIframeData(): Promise<Record<string, unknown>> {
    return this.request<Json, Record<string, unknown>>({
      method: "openlogin_get_data",
    });
  }

  async _cleanup(): Promise<void> {
    await this.provider.cleanup();
  }
}

export default OpenLogin;
