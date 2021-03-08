import { getRpcPromiseCallback, JRPCRequest, JRPCResponse, randomId } from "@openlogin/jrpc";
import { jsonToBase64 } from "@openlogin/jrpc/src/utils";

import { UX_MODE, UX_MODE_TYPE } from "./constants";
import OpenLoginStore from "./OpenLoginStore";
import { Provider } from "./Provider";
import { awaitReq, constructURL, getHashQueryParams } from "./utils";

export const ALLOWED_INTERACTIONS = {
  POPUP: "popup",
  REDIRECT: "redirect",
  JRPC: "jrpc",
};

export type ALLOWED_INTERACTIONS_TYPE = typeof ALLOWED_INTERACTIONS[keyof typeof ALLOWED_INTERACTIONS];

export type RequestParams = {
  url?: string;
  method: string;
  params: Record<string, unknown>[];
  allowedInteractions: ALLOWED_INTERACTIONS_TYPE[];
};

export type BaseLogoutParams = {
  clientId: string;
};

export type WhitelistData = {
  [P in string]: string;
};

export type OpenLoginState = {
  loginUrl: string;
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
  whitelistData: WhitelistData;
};

export type BaseLoginParams = {
  redirectUrl?: string;
};

export type LoginParams = BaseLoginParams & {
  loginProvider: string;
};

export type OpenLoginOptions = {
  clientId: string;
  iframeUrl: string;
  redirectUrl?: string;
  loginUrl?: string;
  webAuthnUrl?: string;
  logoutUrl?: string;
  uxMode?: UX_MODE_TYPE;
  replaceUrlOnRedirect?: boolean;
  whitelistData?: WhitelistData;
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
      redirectUrl: options.redirectUrl ?? `${window.location.protocol}//${window.location.host}${window.location.pathname}`,
      loginUrl: options.loginUrl ?? `${options.iframeUrl}/start`,
      webAuthnUrl: options.webAuthnUrl ?? `${options.iframeUrl}/start`,
      logoutUrl: options.logoutUrl ?? `${options.iframeUrl}/logout`,
      uxMode: options.uxMode ?? UX_MODE.REDIRECT,
      replaceUrlOnRedirect: options.replaceUrlOnRedirect ?? true,
      whitelistData: options.whitelistData ?? { [window.location.origin]: "" },
    });
  }

  initState(options: Required<OpenLoginOptions>): void {
    this.state = {
      uxMode: options.uxMode,
      store: OpenLoginStore.getInstance(),
      iframeUrl: options.iframeUrl,
      loginUrl: options.loginUrl,
      clientId: options.clientId,
      redirectUrl: options.redirectUrl,
      webAuthnUrl: options.webAuthnUrl,
      logoutUrl: options.logoutUrl,
      replaceUrlOnRedirect: options.replaceUrlOnRedirect,
      whitelistData: options.whitelistData,
    };
  }

  async init(): Promise<void> {
    await this.provider.init({ iframeUrl: this.state.iframeUrl });
    this._syncState(getHashQueryParams(this.state.replaceUrlOnRedirect));
    const res = await this._check3PCSupport();
    this.state.support3PC = !!res.result?.support3PC;
    if (this.state.support3PC) {
      this._syncState(await this._getData());
    }
  }

  get privKey(): string {
    return this.state.privKey ?? "";
  }

  async fastLogin(params: Partial<BaseLoginParams>): Promise<{ privKey: string }> {
    const defaultParams: BaseLoginParams = {
      redirectUrl: this.state.redirectUrl,
    };

    const loginParams: BaseLoginParams = {
      ...defaultParams,
      ...params,
    };

    return this.request({
      params: [{ ...loginParams, fastLogin: true }],
      method: "openlogin_login",
      url: this.state.webAuthnUrl,
      allowedInteractions: [ALLOWED_INTERACTIONS.POPUP, ALLOWED_INTERACTIONS.REDIRECT],
    });
  }

  async login(params?: LoginParams & Partial<BaseLoginParams>): Promise<{ privKey: string }> {
    const defaultParams: BaseLoginParams = {
      redirectUrl: this.state.redirectUrl,
    };

    const loginParams: LoginParams = {
      loginProvider: params.loginProvider,
      ...defaultParams,
      ...params,
    };

    // fast login flow
    if (this.state.store.get("touchIDEnabled") === true) {
      return this.fastLogin(loginParams);
    }

    return this.request({
      method: "openlogin_login",
      allowedInteractions: [UX_MODE.REDIRECT, UX_MODE.POPUP],
      url: this.state.loginUrl,
      params: [loginParams],
    });
  }

  async logout(params: Partial<BaseLogoutParams> = {}): Promise<void> {
    delete this.state.privKey;
    await this.request<void>({
      ...{
        method: "openlogin_logout",
        params: [{ ...params }],
        url: this.state.logoutUrl,
        uxMode: this.state.uxMode,
        allowedInteractions: [ALLOWED_INTERACTIONS.JRPC, ALLOWED_INTERACTIONS.POPUP, ALLOWED_INTERACTIONS.REDIRECT],
      },
      ...params,
    });
  }

  async request<T>(args: RequestParams): Promise<T> {
    const pid = randomId().toString();
    let { params } = args;
    const session: { _user: string; _whitelistData: string; _clientId: string } = { _user: "", _whitelistData: "", _clientId: "" };
    if (params.length !== 1) throw new Error("request params array should have only one element");
    const { url, method, allowedInteractions } = args;
    if (allowedInteractions.length === 0) throw new Error("no allowed interactions");

    // TODO: move this out as middleware
    if (this.state.privKey) {
      // TODO: implement signing
      session._user = this.state.privKey;
    }

    if (this.state.whitelistData[window.location.origin]) {
      // TODO: pass along whitelisted urls
      session._whitelistData = this.state.whitelistData[window.location.origin];
    }

    if (this.state.clientId) {
      session._clientId = this.state.clientId;
    }

    // add in session data (allow overrides)
    params = [{ ...session, ...params[0] }];

    if (this.state.support3PC && allowedInteractions.includes(ALLOWED_INTERACTIONS.JRPC)) {
      return this._jrpcRequest<Record<string, unknown>[], T>({ method, params });
    }

    if (this.state.support3PC) {
      // set params first if 3PC supported
      await this._setPIDData(pid, params);
      params = [{}];
    }

    if (!url) {
      throw new Error("no url for redirect / popup flow");
    }

    // method and pid are always in URL hash params
    // convert params from JSON to base64
    const finalUrl = constructURL({ baseURL: url, hash: { b64Params: jsonToBase64(params[0]), _pid: pid, _method: method } });

    if (this.state.uxMode === UX_MODE.REDIRECT) {
      // if redirects preferred, check for redirect flows first, then check for popup flow

      if (allowedInteractions.includes(ALLOWED_INTERACTIONS.REDIRECT)) {
        // give time for synchronous methods to complete before redirect
        setTimeout(() => {
          window.location.href = finalUrl;
        }, 50);
        return {} as T;
      }

      if (allowedInteractions.includes(ALLOWED_INTERACTIONS.POPUP)) {
        const u = new URL(finalUrl);
        u.searchParams.append("_pid", pid);
        window.open(u.toString());
        // TODO: implement popup flow
        return awaitReq<T>(pid);
      }
    } else {
      // if popups preferred, check for popup flows first, then check for redirect flow

      if (allowedInteractions.includes(ALLOWED_INTERACTIONS.POPUP)) {
        const u = new URL(finalUrl);
        u.searchParams.append("_pid", pid);
        window.open(u.toString());
        // TODO: implement popup flow
        return awaitReq<T>(pid);
      }

      if (allowedInteractions.includes(ALLOWED_INTERACTIONS.REDIRECT)) {
        // give time for synchronous methods to complete before redirect
        setTimeout(() => {
          window.location.href = finalUrl;
        }, 50);
        return null;
      }
    }

    throw new Error("no matching allowed interactions");
  }

  async _jrpcRequest<T, U>(args: JRPCRequest<T>): Promise<U> {
    // await this.initialized;
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      throw new Error("invalid request args");
    }

    const { method, params } = args;

    if (typeof method !== "string" || method.length === 0) {
      throw new Error("invalid request method");
    }

    if (params === undefined || !Array.isArray(params)) {
      throw new Error("invalid request params");
    }

    if (params.length === 0) {
      params.push({});
    }

    return new Promise<U>((resolve, reject) => {
      this.provider._rpcRequest({ method, params }, getRpcPromiseCallback(resolve, reject));
    });
  }

  async _check3PCSupport(): Promise<JRPCResponse<Record<string, boolean>>> {
    return this._jrpcRequest<Record<string, unknown>[], JRPCResponse<Record<string, boolean>>>({
      method: "openlogin_check_3PC_support",
      params: [{}],
    });
  }

  async _setPIDData(pid: string, data: Record<string, unknown>[]): Promise<void> {
    await this.request({
      allowedInteractions: [ALLOWED_INTERACTIONS.JRPC],
      method: "openlogin_set_pid_data",
      params: [
        {
          pid,
          data: data[0],
        },
      ],
    });
  }

  async _getData(): Promise<Record<string, unknown>> {
    const jrpcRes = await this.request<JRPCResponse<Record<string, unknown>>>({
      allowedInteractions: [ALLOWED_INTERACTIONS.JRPC],
      method: "openlogin_get_data",
      params: [{}],
    });
    if (jrpcRes.error) {
      throw new Error(`get data error ${jrpcRes.error}`);
    }
    return jrpcRes.result;
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
    const { store } = this.state;
    this.state = { ...this.state, ...newState, store };
  }

  async _cleanup(): Promise<void> {
    await this.provider.cleanup();
  }
}

export default OpenLogin;
