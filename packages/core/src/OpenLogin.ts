import { getPublic, sign } from "@toruslabs/eccrypto";
import { getRpcPromiseCallback, JRPCRequest, OriginData, SessionInfo } from "@toruslabs/openlogin-jrpc";
import { base64url, jsonToBase64, keccak, randomId, URLWithHashParams } from "@toruslabs/openlogin-utils";

import {
  ALLOWED_INTERACTIONS,
  BaseLogoutParams,
  BaseRedirectParams,
  LoginParams,
  OPENLOGIN_METHOD,
  OPENLOGIN_NETWORK,
  OPENLOGIN_NETWORK_TYPE,
  OpenLoginOptions,
  RequestParams,
  UX_MODE,
  UX_MODE_TYPE,
} from "./constants";
import { Modal } from "./Modal";
import OpenLoginStore from "./OpenLoginStore";
import Provider from "./Provider";
import { awaitReq, constructURL, getHashQueryParams } from "./utils";

export type OpenLoginState = {
  network: OPENLOGIN_NETWORK_TYPE;
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
  originData: OriginData;
};

class OpenLogin {
  provider: Provider;

  state: OpenLoginState;

  modal: Modal;

  constructor(options: OpenLoginOptions) {
    this.provider = new Proxy(new Provider(), {
      deleteProperty: () => true, // work around for web3
    });
    this.modal = new Modal(`${options.iframeUrl}/sdk-modal`);
    if (options.network === OPENLOGIN_NETWORK.MAINNET) {
      options.iframeUrl = "https://manage.openlogin.com";
    } else if (options.network === OPENLOGIN_NETWORK.TESTNET) {
      options.iframeUrl = "https://beta.openlogin.com";
    } else if (!options.iframeUrl) {
      throw new Error("unspecified network and iframeUrl");
    }
    this.initState({
      ...options,
      iframeUrl: options.iframeUrl,
      redirectUrl: options.redirectUrl ?? `${window.location.protocol}//${window.location.host}${window.location.pathname}`,
      loginUrl: options.loginUrl ?? `${options.iframeUrl}/start`,
      webAuthnUrl: options.webAuthnUrl ?? `${options.iframeUrl}/start`,
      logoutUrl: options.logoutUrl ?? `${options.iframeUrl}/start`,
      uxMode: options.uxMode ?? UX_MODE.REDIRECT,
      replaceUrlOnRedirect: options.replaceUrlOnRedirect ?? true,
      originData: options.originData ?? { [window.location.origin]: "" },
    });
  }

  initState(options: Required<OpenLoginOptions>): void {
    this.state = {
      uxMode: options.uxMode,
      network: options.network,
      store: OpenLoginStore.getInstance(),
      iframeUrl: options.iframeUrl,
      loginUrl: options.loginUrl,
      clientId: options.clientId,
      redirectUrl: options.redirectUrl,
      webAuthnUrl: options.webAuthnUrl,
      logoutUrl: options.logoutUrl,
      replaceUrlOnRedirect: options.replaceUrlOnRedirect,
      originData: options.originData,
    };
  }

  async init(): Promise<void> {
    await Promise.all([this.provider.init({ iframeUrl: this.state.iframeUrl }), this.modal.init()]);

    this._syncState(getHashQueryParams(this.state.replaceUrlOnRedirect));
    const res = await this._check3PCSupport();
    this.state.support3PC = !!res.support3PC;
    if (this.state.support3PC) {
      this._syncState(await this._getData());
    }
  }

  get privKey(): string {
    return this.state.privKey ? this.state.privKey.padStart(64, "0") : "";
  }

  async fastLogin(params: Partial<BaseRedirectParams>): Promise<{ privKey: string }> {
    const defaultParams: BaseRedirectParams = {
      redirectUrl: this.state.redirectUrl,
    };

    const loginParams: BaseRedirectParams = {
      ...defaultParams,
      ...params,
    };

    return this.request({
      params: [{ ...loginParams, fastLogin: true }],
      method: OPENLOGIN_METHOD.LOGIN,
      url: this.state.webAuthnUrl,
      allowedInteractions: [ALLOWED_INTERACTIONS.POPUP, ALLOWED_INTERACTIONS.REDIRECT],
    });
  }

  async login(params?: LoginParams & Partial<BaseRedirectParams>): Promise<{ privKey: string }> {
    if (params) {
      return this._selectedLogin(params);
    }
    return this._modal(params);
  }

  async _selectedLogin(params: LoginParams & Partial<BaseRedirectParams>): Promise<{ privKey: string }> {
    const defaultParams: BaseRedirectParams = {
      redirectUrl: this.state.redirectUrl,
    };

    const loginParams: LoginParams = {
      loginProvider: params.loginProvider,
      ...defaultParams,
      ...params,
    };

    // fast login flow
    if (this.state.store.get("touchIDPreference") === "enabled") {
      return this.fastLogin(loginParams);
    }

    return this.request({
      method: OPENLOGIN_METHOD.LOGIN,
      allowedInteractions: [UX_MODE.REDIRECT, UX_MODE.POPUP],
      url: this.state.loginUrl,
      params: [loginParams],
    });
  }

  async logout(logoutParams: Partial<BaseLogoutParams> & Partial<BaseRedirectParams> = {}): Promise<void> {
    const params: Record<string, unknown> = {};
    // defaults
    params.redirectUrl = this.state.redirectUrl;
    params._clientId = this.state.clientId;

    if (logoutParams.clientId) {
      params._clientId = logoutParams.clientId;
    }
    if (logoutParams.fastLogin !== undefined) {
      params.fastLogin = logoutParams.fastLogin;
    }
    if (logoutParams.redirectUrl !== undefined) {
      params.redirectUrl = logoutParams.redirectUrl;
    }

    const res = await this.request<void>({
      method: OPENLOGIN_METHOD.LOGOUT,
      params: [params],
      url: this.state.logoutUrl,
      allowedInteractions: [ALLOWED_INTERACTIONS.JRPC, ALLOWED_INTERACTIONS.POPUP, ALLOWED_INTERACTIONS.REDIRECT],
    });

    this.state.privKey = "";
    if (!params.fastLogin) this.state.store.set("touchIDPreference", "disabled");
    return res;
  }

  async request<T>(args: RequestParams): Promise<T> {
    const pid = randomId().toString();
    let { params } = args;

    // Note: _origin is added later in postMessageStream for jrpc requests
    // do not add it here since its used for checking postMessage constraints
    const session: Partial<SessionInfo> = {};
    if (params.length !== 1) throw new Error("request params array should have only one element");
    const { url, method, allowedInteractions } = args;
    if (allowedInteractions.length === 0) throw new Error("no allowed interactions");

    if (this.state.clientId) {
      session._clientId = this.state.clientId;
    }

    if (this.state.privKey) {
      const userData = {
        clientId: session._clientId,
        timestamp: Date.now().toString(),
      };
      const sig = await sign(
        Buffer.from(this.state.privKey.padStart(64, "0"), "hex"),
        Buffer.from(keccak("keccak256").update(JSON.stringify(userData)).digest("hex"), "hex")
      );
      session._user = getPublic(Buffer.from(this.state.privKey.padStart(64, "0"), "hex")).toString("hex");
      session._userSig = base64url.encode(sig);
      session._userData = userData;
    }

    session._originData = this.state.originData;

    // add in session data (allow overrides)
    params = [{ ...session, ...params[0] }];

    // use JRPC where possible

    if (this.state.support3PC && allowedInteractions.includes(ALLOWED_INTERACTIONS.JRPC)) {
      return this._jrpcRequest<Record<string, unknown>[], T>({ method, params });
    }

    // set origin
    params[0]._origin = new URL((params[0].redirectUrl as string) ?? this.state.redirectUrl).origin;

    // preset params
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
    const finalUrl = constructURL({
      baseURL: url,
      hash: { b64Params: jsonToBase64(params[0]), _pid: pid, _method: method },
    });

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
        const u = new URLWithHashParams(finalUrl);
        u.hashParams.append("_pid", pid);
        window.open(u.toString());
        // TODO: implement popup flow
        return awaitReq<T>(pid);
      }
    } else {
      // if popups preferred, check for popup flows first, then check for redirect flow

      if (allowedInteractions.includes(ALLOWED_INTERACTIONS.POPUP)) {
        const u = new URLWithHashParams(finalUrl);
        u.hashParams.append("_pid", pid);
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

  async _check3PCSupport(): Promise<Record<string, boolean>> {
    return this._jrpcRequest<Record<string, unknown>[], Record<string, boolean>>({
      method: OPENLOGIN_METHOD.CHECK_3PC_SUPPORT,
      params: [{ _originData: this.state.originData }],
    });
  }

  async _setPIDData(pid: string, data: Record<string, unknown>[]): Promise<void> {
    await this.request({
      allowedInteractions: [ALLOWED_INTERACTIONS.JRPC],
      method: OPENLOGIN_METHOD.SET_PID_DATA,
      params: [
        {
          pid,
          data: data[0],
        },
      ],
    });
  }

  async _getData(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>({
      allowedInteractions: [ALLOWED_INTERACTIONS.JRPC],
      method: OPENLOGIN_METHOD.GET_DATA,
      params: [{}],
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
    const { store } = this.state;
    this.state = { ...this.state, ...newState, store };
  }

  async _modal(
    params?: LoginParams & Partial<BaseRedirectParams>
  ): Promise<{
    privKey: string;
  }> {
    return new Promise<{ privKey: string }>((resolve, reject) => {
      this.modal._prompt(
        this.state.clientId,
        async (chunk): Promise<void> => {
          if (chunk.cancel) {
            reject(new Error("user canceled login"));
          } else {
            resolve(await this._selectedLogin({ ...params, ...chunk }));
          }
        }
      );
    });
  }

  async _cleanup(): Promise<void> {
    await this.provider.cleanup();
    await this.modal.cleanup();
  }
}

export default OpenLogin;
