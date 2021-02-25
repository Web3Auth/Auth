import { getRpcPromiseCallback, JRPCRequest, Json, randomId } from "@openlogin/jrpc";

import { UX_MODE, UX_MODE_TYPE } from "./constants";
import OpenLoginStore from "./OpenLoginStore";
import { Provider } from "./Provider";
import { awaitReq, constructURL, getHashQueryParams, Maybe } from "./utils";

type TorusKey = {
  privateKey: "";
  pubKey: {
    pub_key_X: "";
    pub_key_Y: "";
  };
  publicAddress: "";
  metadataNonce: "";
};

export type UserProfile = {
  userKey: TorusKey;
};

type OpenLoginState = {
  authUrl: string;
  userProfile?: UserProfile;
  support3PC?: boolean;
  clientId: string;
  iframeUrl: string;
  redirectUrl: string;
  webAuthnUrl: string;
  store: OpenLoginStore;
  uxMode: UX_MODE_TYPE;
  replaceUrlOnRedirect: boolean;
};

type BaseLoginParams = {
  clientId: string;
  uxMode: UX_MODE_TYPE;
  redirectUrl?: string;
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
  uxMode?: UX_MODE_TYPE;
  replaceUrlOnRedirect?: boolean;
};

class OpenLogin {
  provider: Provider;

  // private _initializedResolve: () => void;

  state: OpenLoginState;

  constructor(options: OpenLoginOptions) {
    // this.initialized = new Promise((resolve) => {
    //   this._initializedResolve = resolve;
    // });
    this.provider = new Proxy(new Provider(), {
      deleteProperty: () => true, // work around for web3
    });
    this.initState({
      ...options,
      redirectUrl: options.redirectUrl ?? window.location.href,
      authUrl: options.authUrl ?? `${options.iframeUrl}/auth`,
      webAuthnUrl: options.webAuthnUrl ?? `${options.iframeUrl}/auth`,
      uxMode: options.uxMode ?? UX_MODE.REDIRECT,
      replaceUrlOnRedirect: options.replaceUrlOnRedirect ?? true,
    });
  }

  initState(options: Required<OpenLoginOptions>): void {
    this.state = {
      uxMode: options.uxMode,
      store: OpenLoginStore.getInstance(),
      iframeUrl: options.iframeUrl,
      authUrl: options.authUrl,
      clientId: options.clientId,
      redirectUrl: options.redirectUrl,
      webAuthnUrl: options.webAuthnUrl,
      replaceUrlOnRedirect: options.replaceUrlOnRedirect,
    };
  }

  async init(): Promise<void> {
    await this.provider.init({ iframeUrl: this.state.iframeUrl });
    this._syncState(getHashQueryParams(this.state.replaceUrlOnRedirect));
    const res = await this._check3PCSupport();
    this.state.support3PC = !!res.support3PC;
    if (this.state.support3PC) {
      this._syncState(await this._getIframeData());
    }
    // this._initializedResolve();
  }

  async fastLogin(params: BaseLoginParams): Promise<UserProfile> {
    // await this.initialized;
    let webAuthnLoginUrl: string;
    if (!this.state.support3PC) {
      webAuthnLoginUrl = constructURL(this.state.authUrl, params);
    } else {
      await this._setParams(params);
      webAuthnLoginUrl = this.state.webAuthnUrl;
    }
    return this.open(webAuthnLoginUrl);
  }

  async login(params: Partial<LoginParams>): Promise<UserProfile> {
    // await this.initialized;

    if (this.state.userProfile) {
      return this.state.userProfile;
    }

    const defaultParams: BaseLoginParams = {
      clientId: this.state.clientId,
      redirectUrl: this.state.redirectUrl,
      uxMode: this.state.uxMode,
    };

    // fast login flow
    if (this.state.store.get("webAuthnPreferred") === true) {
      return this.fastLogin(defaultParams);
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
      await this._setParams(loginParams);
      loginUrl = this.state.authUrl;
    }

    return this.open(loginUrl);
  }

  // eslint-disable-next-line class-methods-use-this
  async open(url: string, popup = false): Promise<UserProfile> {
    // await this.initialized;
    if (popup) {
      const u = new URL(url);
      const reqId = randomId().toString();
      u.searchParams.append("reqId", reqId);
      const data = await awaitReq(reqId);
      return {
        userKey: data.userKey as TorusKey,
      };
    }
    // TODO: implement redirect handling
    window.location.href = url;
    return null; // redirects anyway
  }

  async request<T, U>(args: JRPCRequest<T>): Promise<Maybe<U>> {
    // await this.initialized;
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

  async _check3PCSupport(): Promise<Record<string, unknown>> {
    return this.request<Json, Record<string, unknown>>({
      method: "openlogin_check_3PC_support",
      params: [],
    });
  }

  async _setParams(loginParams: Omit<Partial<LoginParams>, "uxMode">): Promise<void> {
    await this.request<Json, Record<string, unknown>>({
      method: "openlogin_set_params",
      params: [loginParams],
    });
  }

  async _getIframeData(): Promise<Record<string, unknown>> {
    return this.request<Json, Record<string, unknown>>({
      method: "openlogin_get_data",
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

  async _cleanup(): Promise<void> {
    await this.provider.cleanup();
  }
}

export default OpenLogin;
