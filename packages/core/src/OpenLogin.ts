import { getRpcPromiseCallback, JRPCRequest, Json, randomId } from "@openlogin/jrpc";

import { UX_MODE, UX_MODE_TYPE } from "./constants";
import OpenLoginStore from "./OpenLoginStore";
import { Provider } from "./Provider";
import { awaitReq, constructURL, getHashQueryParams, Maybe } from "./utils";

type BaseLogoutParams = {
  clientId: string;
  uxMode: UX_MODE_TYPE;
};

type OpenLoginState = {
  authUrl: string;
  privKey?: string;
  support3PC?: boolean;
  clientId: string;
  iframeUrl: string;
  redirectUrl: string;
  webAuthnUrl: string;
  logoutUrl: string;
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
  logoutUrl?: string;
  uxMode?: UX_MODE_TYPE;
  replaceUrlOnRedirect?: boolean;
};

class OpenLogin {
  provider: Provider;

  state: OpenLoginState;

  constructor(options: OpenLoginOptions) {
    this.provider = new Proxy(new Provider(), {
      deleteProperty: () => true, // work around for web3
    });
    this.initState({
      ...options,
      redirectUrl: options.redirectUrl ?? window.location.href,
      authUrl: options.authUrl ?? `${options.iframeUrl}/start`,
      webAuthnUrl: options.webAuthnUrl ?? `${options.iframeUrl}/start`,
      logoutUrl: options.logoutUrl ?? `${options.iframeUrl}/logout`,
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
      logoutUrl: options.logoutUrl,
      replaceUrlOnRedirect: options.replaceUrlOnRedirect,
    };
  }

  async init(): Promise<void> {
    await this.provider.init({ iframeUrl: this.state.iframeUrl });
    this._syncState(getHashQueryParams(this.state.replaceUrlOnRedirect));
    const res = await this._check3PCSupport();
    this.state.support3PC = !!res.support3PC;
    if (this.state.support3PC) {
      await this._setParams({ clientId: this.state.clientId });
      this._syncState(await this._getIframeData());
    }
  }

  async fastLogin(params?: Partial<BaseLoginParams>): Promise<{ userKey?: string }> {
    const defaultParams: BaseLoginParams = {
      clientId: this.state.clientId,
      redirectUrl: this.state.redirectUrl,
      uxMode: this.state.uxMode,
    };

    const loginParams: BaseLoginParams = {
      ...defaultParams,
      ...params,
    };

    let webAuthnLoginUrl: string;
    if (!this.state.support3PC) {
      webAuthnLoginUrl = constructURL(this.state.authUrl, loginParams);
    } else {
      await this._setParams(loginParams);
      webAuthnLoginUrl = this.state.webAuthnUrl;
    }
    return this.open(webAuthnLoginUrl, loginParams.uxMode);
  }

  async login(params?: LoginParams & Partial<BaseLoginParams>): Promise<string> {
    // await this.initialized;

    if (this.state.privKey) {
      return this.state.privKey;
    }

    const defaultParams: BaseLoginParams = {
      clientId: this.state.clientId,
      redirectUrl: this.state.redirectUrl,
      uxMode: this.state.uxMode,
    };

    // fast login flow
    if (this.state.store.get("webAuthnPreferred") === true) {
      return (await this.fastLogin(defaultParams)).userKey;
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
      loginUrl = constructURL(this.state.authUrl, { clientId: loginParams.clientId });
    }

    return (await this.open<{ userKey: string }>(loginUrl, loginParams.uxMode)).userKey;
  }

  async logout(params?: Partial<BaseLogoutParams>): Promise<void> {
    if (!this.state.privKey) {
      return;
    }
    const defaultParams: BaseLogoutParams = {
      uxMode: this.state.uxMode,
      clientId: this.state.clientId,
    };

    const logoutParams: BaseLoginParams = {
      ...defaultParams,
      ...params,
    };

    if (this.state.support3PC) {
      await this._requestLogout();
    } else {
      const logoutUrl = constructURL(this.state.logoutUrl, { clientId: logoutParams.clientId });
      await this.open(logoutUrl, logoutParams.uxMode);
    }

    delete this.state.privKey;
  }

  // eslint-disable-next-line class-methods-use-this
  async open<T>(url: string, uxMode: UX_MODE_TYPE): Promise<T> {
    // await this.initialized;
    if (uxMode === UX_MODE.POPUP) {
      const u = new URL(url);
      const pid = randomId().toString();
      u.searchParams.append("pid", pid);
      window.open(u.toString());
      return awaitReq<T>(pid);
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

  async _requestLogout(): Promise<void> {
    await this.request<Json, Record<string, unknown>>({
      method: "openlogin_logout",
      params: [{ clientId: this.state.clientId }],
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
      params: [{ clientId: this.state.clientId }],
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
    }
    this.state = { ...this.state, ...newState };
  }

  async _cleanup(): Promise<void> {
    await this.provider.cleanup();
  }
}

export default OpenLogin;
