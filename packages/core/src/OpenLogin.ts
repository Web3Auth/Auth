import { getRpcPromiseCallback, JRPCRequest, Json } from "@openlogin/jrpc";

import OpenLoginStore from "./OpenLoginStore";
import { Provider } from "./Provider";
import { constructURL, Maybe } from "./utils";

type OpenLoginState = {
  authUrl: string;
  userProfile?: Json;
  support3PC?: boolean;
  clientId: string;
  iframeUrl: string;
  redirectUrl: string;
  webAuthnUrl: string;
  loginProvider?: string;
  store: OpenLoginStore;
  popup: boolean;
};

type BaseLoginParams = {
  clientId: string;
  popup: boolean;
  redirectUrl: string;
};

type LoginParams = BaseLoginParams & {
  loginProvider: string;
};

type OpenLoginOptions = {
  clientId: string;
  iframeUrl: string;
  redirectUrl?: string;
  authUrl?: string;
  webAuthnUrl?: string;
  popup?: boolean;
};

class OpenLogin {
  provider: Provider;

  state: OpenLoginState;

  constructor(options: OpenLoginOptions) {
    if (!options.redirectUrl) {
      options.redirectUrl = window.location.href;
    }
    if (!options.authUrl) {
      options.authUrl = `${options.iframeUrl}/auth`;
    }
    if (!options.webAuthnUrl) {
      options.webAuthnUrl = `${options.iframeUrl}/webauthn`;
    }
    if (!options.popup) {
      options.popup = false;
    }
    this.provider = new Proxy(new Provider(), {
      deleteProperty: () => true, // work around for web3
    });
    this.initState(options);
  }

  initState(options: OpenLoginOptions): void {
    this.state = {
      popup: options.popup,
      store: OpenLoginStore.getInstance(),
      iframeUrl: options.iframeUrl,
      authUrl: options.authUrl,
      clientId: options.clientId,
      redirectUrl: options.redirectUrl,
      webAuthnUrl: options.webAuthnUrl,
    };
  }

  async init(): Promise<void> {
    await this.provider.init({ iframeUrl: this.state.iframeUrl });
    this._syncState(await this._getIframeData());
    this._syncState(this._getHashQueryParams());
  }

  async webAuthnLogin(params: BaseLoginParams): Promise<void> {
    let webAuthnLoginUrl: string;
    if (!this.state.support3PC) {
      webAuthnLoginUrl = constructURL(this.state.authUrl, params);
    } else {
      await this._setWebAuthnLoginParams(params);
      webAuthnLoginUrl = this.state.webAuthnUrl;
    }
    return this.open(webAuthnLoginUrl);
  }

  async login(params: Partial<LoginParams>): Promise<void> {
    const defaultParams: BaseLoginParams = {
      clientId: this.state.clientId,
      redirectUrl: this.state.redirectUrl,
      popup: this.state.popup,
    };
    // fast login flow
    if (this.state.store.get("webAuthnPreferred") === true) {
      return this.webAuthnLogin(defaultParams);
    }

    let loginUrl: string;

    const loginParams: LoginParams = {
      loginProvider: params.loginProvider,
      ...defaultParams,
      ...params,
    };

    if (!this.state.support3PC) {
      loginUrl = constructURL(this.state.authUrl, loginParams);
    } else {
      await this._setLoginParams(loginParams);
      loginUrl = this.state.authUrl;
    }

    return this.open(loginUrl);
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

  async _setWebAuthnLoginParams(params: BaseLoginParams): Promise<Record<string, unknown>> {
    return this.request<Json, Record<string, unknown>>({
      method: "openlogin_set_webauthn_login_params",
      params: [params],
    });
  }

  async _setLoginParams(loginParams: LoginParams): Promise<Record<string, unknown>> {
    return this.request<Json, Record<string, unknown>>({
      method: "openlogin_set_login_params",
      params: [loginParams],
    });
  }

  _syncState(newState: Record<string, unknown>): void {
    if (newState.store) {
      if (typeof newState.store !== "object") {
        throw new Error("expected store to be an object");
      }
      Object.keys(newState.store).forEach((key) => {
        this.state.store.set(key, newState.store[key]);
      });
      delete newState.store;
    }
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
