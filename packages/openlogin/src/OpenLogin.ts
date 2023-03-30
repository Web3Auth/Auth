import { decrypt, Ecies, encrypt, getPublic, sign } from "@toruslabs/eccrypto";
import { get } from "@toruslabs/http-helpers";
import { LoginConfig, OriginData, SessionInfo, WhiteLabelData } from "@toruslabs/openlogin-jrpc";
import { OpenloginSessionManager } from "@toruslabs/openlogin-session-manager";
import { base64url, BrowserStorage, jsonToBase64, keccak, randomId } from "@toruslabs/openlogin-utils";
import log from "loglevel";

import { ALLOWED_INTERACTIONS, OPENLOGIN_METHOD, OPENLOGIN_NETWORK, UX_MODE } from "./constants";
import {
  BaseRedirectParams,
  CUSTOM_LOGIN_PROVIDER_TYPE,
  LOGIN_PROVIDER_TYPE,
  LoginParams,
  OPENLOGIN_NETWORK_TYPE,
  OpenLoginOptions,
  OpenloginSessionData,
  OpenloginUserInfo,
  RequestParams,
  UX_MODE_TYPE,
} from "./interfaces";
import { awaitReq, constructURL, getHashQueryParams, getPopupFeatures } from "./utils";

export type OpenLoginState = {
  network: OPENLOGIN_NETWORK_TYPE;
  privKey?: string;
  coreKitKey?: string;
  ed25519PrivKey?: string;
  coreKitEd25519PrivKey?: string;
  walletKey?: string;
  tKey?: string;
  oAuthPrivateKey?: string;
  clientId: string;
  iframeUrl: string;
  redirectUrl: string;
  startUrl: string;
  popupUrl: string;
  store: OpenloginSessionData["store"];
  uxMode: UX_MODE_TYPE;
  replaceUrlOnRedirect: boolean;
  originData: OriginData;
  whiteLabel: WhiteLabelData;
  loginConfig: LoginConfig;
  storageServerUrl: string;
  sessionNamespace: string;
  webauthnTransports: AuthenticatorTransport[];
  sessionTime: number;
};

class OpenLogin {
  state: OpenLoginState;

  private sessionManager: OpenloginSessionManager<OpenloginSessionData>;

  private store: BrowserStorage;

  private _storageBaseKey = "openlogin_store";

  constructor(options: OpenLoginOptions) {
    if (!options._iframeUrl) {
      if (options.network === OPENLOGIN_NETWORK.MAINNET) {
        options._iframeUrl = "https://app.openlogin.com";
      } else if (options.network === OPENLOGIN_NETWORK.CYAN) {
        options._iframeUrl = "https://cyan.openlogin.com";
      } else if (options.network === OPENLOGIN_NETWORK.TESTNET) {
        options._iframeUrl = "https://beta.openlogin.com";
      } else if (options.network === OPENLOGIN_NETWORK.SK_TESTNET) {
        options._iframeUrl = "https://beta-sk.openlogin.com";
      } else if (options.network === OPENLOGIN_NETWORK.CELESTE) {
        options._iframeUrl = "https://celeste.openlogin.com";
      } else if (options.network === OPENLOGIN_NETWORK.AQUA) {
        options._iframeUrl = "https://aqua.openlogin.com";
      } else if (options.network === OPENLOGIN_NETWORK.DEVELOPMENT) {
        options._iframeUrl = "http://localhost:3000";
      }
    }
    if (!options._iframeUrl) {
      throw new Error("unspecified network and iframeUrl");
    }

    this.initState({
      ...options,
      _iframeUrl: options._iframeUrl,
      _startUrl: options._startUrl ?? `${options._iframeUrl}/start`,
      _popupUrl: options._popupUrl ?? `${options._iframeUrl}/popup-window`,
      redirectUrl: options.redirectUrl ?? `${window.location.protocol}//${window.location.host}${window.location.pathname}`,
      uxMode: options.uxMode ?? UX_MODE.REDIRECT,
      replaceUrlOnRedirect: options.replaceUrlOnRedirect ?? true,
      originData: options.originData ?? { [window.location.origin]: "" },
      whiteLabel: options.whiteLabel ?? {},
      loginConfig: options.loginConfig ?? {},
      _storageServerUrl: options._storageServerUrl ?? "https://broadcast-server.tor.us",
      storageKey: options.storageKey === "session" ? "session" : "local",
      _sessionNamespace: options._sessionNamespace ?? "",
      webauthnTransports: options.webauthnTransports ?? ["internal"],
      sessionTime: options.sessionTime ?? 86400,
    });

    this.sessionManager = new OpenloginSessionManager({
      sessionServerBaseUrl: this.state.storageServerUrl,
      sessionNamespace: this.state.sessionNamespace,
      sessionTime: this.state.sessionTime,
    });
    const storageKey = this.state.sessionNamespace ? `${this._storageBaseKey}_${this.state.sessionNamespace}` : this._storageBaseKey;
    this.store = BrowserStorage.getInstance(storageKey, options.storageKey);
  }

  get privKey(): string {
    return this.state.privKey ? this.state.privKey.padStart(64, "0") : "";
  }

  get coreKitKey(): string {
    return this.state.coreKitKey ? this.state.coreKitKey.padStart(64, "0") : "";
  }

  initState(options: Required<OpenLoginOptions>): void {
    this.state = {
      uxMode: options.uxMode,
      network: options.network,
      store: {} as OpenloginSessionData["store"],
      iframeUrl: options._iframeUrl,
      startUrl: options._startUrl,
      popupUrl: options._popupUrl,
      clientId: options.clientId,
      redirectUrl: options.redirectUrl,
      replaceUrlOnRedirect: options.replaceUrlOnRedirect,
      originData: options.originData,
      loginConfig: options.loginConfig,
      whiteLabel: options.whiteLabel,
      storageServerUrl: options._storageServerUrl,
      sessionNamespace: options._sessionNamespace,
      webauthnTransports: options.webauthnTransports,
      sessionTime: options.sessionTime,
    };
  }

  async init(): Promise<void> {
    if (this.state.network === OPENLOGIN_NETWORK.TESTNET) {
      // using console log because it shouldn't be affected by loglevel config
      // eslint-disable-next-line no-console
      console.log("%c WARNING! You are on testnet. Please set network: 'mainnet' in production", "color: #FF0000");
    }

    await this.updateOriginData();

    const params = getHashQueryParams(this.state.replaceUrlOnRedirect);
    if (params.sessionId) {
      this.store.set("sessionId", params.sessionId);
    }

    // if this is after redirect, directly sync data.
    if (params.store) {
      this._syncState(params);
    } else {
      // rehydrate the session if sessionId is present.
      const sessionId = this.store.get<string>("sessionId");
      const data = await this._authorizeSession(sessionId);
      this._syncState(data);
    }
  }

  async updateOriginData(): Promise<void> {
    const filteredOriginData = JSON.parse(JSON.stringify(this.state.originData));
    Object.keys(filteredOriginData).forEach((key) => {
      if (filteredOriginData[key] === "") delete filteredOriginData[key];
    });
    const [whitelist, whiteLabel] = await Promise.all([this.getWhitelist(), this.getWhiteLabel()]);
    this._syncState({ originData: { ...whitelist, ...filteredOriginData }, whiteLabel: { ...whiteLabel, ...this.state.whiteLabel } });
  }

  async getWhitelist(): Promise<OriginData> {
    try {
      const { clientId } = this.state;
      if (!clientId) {
        throw new Error("unspecified clientId");
      }
      const url = new URL("https://api.developer.tor.us/whitelist");
      url.searchParams.append("project_id", this.state.clientId);
      url.searchParams.append("network", this.state.network);
      const res = await get<{ signed_urls: OriginData }>(url.href);
      return res.signed_urls;
    } catch (_) {
      // fail silently
      return {};
    }
  }

  async getWhiteLabel(): Promise<WhiteLabelData> {
    try {
      const { clientId } = this.state;
      if (!clientId) {
        throw new Error("unspecified clientId");
      }
      const url = new URL("https://api.developer.tor.us/whitelabel");
      url.searchParams.append("project_id", this.state.clientId);
      const res = await get<{ whiteLabel: WhiteLabelData }>(url.href);
      return res.whiteLabel;
    } catch (_) {
      // fail silently
      return {};
    }
  }

  async login(params: LoginParams & Partial<BaseRedirectParams>): Promise<{ privKey: string }> {
    if (!params || !params.loginProvider) {
      throw new Error(`Please pass loginProvider in params`);
    }

    return this._selectedLogin(params);
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

    const res = await this.request<OpenloginSessionData & { _nextRedirect?: string }>({
      method: OPENLOGIN_METHOD.LOGIN,
      allowedInteractions: [UX_MODE.REDIRECT, UX_MODE.POPUP],
      startUrl: this.state.startUrl,
      popupUrl: this.state.popupUrl,
      params: [loginParams],
    });
    if (res.store) {
      delete res._nextRedirect;
      this._syncState(res);
    }

    return { privKey: this.privKey };
  }

  async logout(): Promise<void> {
    const sessionId = this.store.get<string>("sessionId");
    if (!sessionId) throw new Error("User not logged in");

    await this.sessionManager.invalidateSession(sessionId);

    this._syncState({
      privKey: "",
      coreKitKey: "",
      coreKitEd25519PrivKey: "",
      ed25519PrivKey: "",
      walletKey: "",
      oAuthPrivateKey: "",
      tKey: "",
      store: {
        name: "",
        profileImage: "",
        dappShare: "",
        idToken: "",
        oAuthIdToken: "",
        oAuthAccessToken: "",
        appState: "",
        email: "",
        verifier: "",
        verifierId: "",
        aggregateVerifier: "",
        typeOfLogin: "",
      },
    });

    this.store.set("sessionId", "");
  }

  async request<T>(args: RequestParams): Promise<T> {
    const pid = randomId();
    let { params } = args;

    // Note: _origin is added later in postMessageStream for jrpc requests
    // do not add it here since its used for checking postMessage constraints
    const session: Partial<SessionInfo> = {};
    if (params.length !== 1) throw new Error("request params array should have only one element");
    const { startUrl, popupUrl, method, allowedInteractions } = args;
    if (allowedInteractions.length === 0) throw new Error("no allowed interactions");

    if (this.state.clientId) {
      session._clientId = this.state.clientId;
    }
    if (this.state.sessionNamespace) {
      session._sessionNamespace = this.state.sessionNamespace;
    }

    if (this.privKey) {
      const userData = {
        clientId: session._clientId,
        timestamp: Date.now().toString(),
      };
      const sig = await sign(
        Buffer.from(this.privKey, "hex"),
        Buffer.from(keccak("keccak256").update(JSON.stringify(userData)).digest("hex"), "hex")
      );
      session._user = getPublic(Buffer.from(this.privKey, "hex")).toString("hex");
      session._userSig = base64url.encode(sig);
      session._userData = userData;
    }

    session._originData = this.state.originData;
    session._whiteLabelData = this.state.whiteLabel;
    session._loginConfig = this.state.loginConfig;
    session._sessionId = this.store.get<string>("sessionId");
    session._webauthnTransports = this.state.webauthnTransports;

    if (!session._sessionId) {
      const sessionId = randomId();
      session._sessionId = sessionId as string;
      this.store.set("sessionId", sessionId);
    }

    // add in session data (allow overrides)
    params = [{ ...session, ...params[0] }];

    // set origin
    params[0]._origin = new URL((params[0].redirectUrl as string) ?? this.state.redirectUrl).origin;

    if (!startUrl || !popupUrl) {
      throw new Error("no url for redirect / popup flow");
    }

    // method and pid are always in URL hash params
    // convert params from JSON to base64

    if (this.state.uxMode === UX_MODE.REDIRECT || this.state.uxMode === UX_MODE.SESSIONLESS_REDIRECT) {
      // if redirects preferred, check for redirect flows first, then check for popup flow

      if (allowedInteractions.includes(ALLOWED_INTERACTIONS.REDIRECT)) {
        // give time for synchronous methods to complete before redirect
        setTimeout(() => {
          window.location.href = constructURL({
            baseURL: startUrl,
            hash: { b64Params: jsonToBase64(params[0]), _pid: pid, _method: method },
          });
        }, 50);
        return {} as T;
      }

      if (allowedInteractions.includes(ALLOWED_INTERACTIONS.POPUP)) {
        const u = new URL(
          constructURL({
            baseURL: popupUrl,
            hash: { b64Params: jsonToBase64(params[0]), _pid: pid, _method: method },
          })
        );
        const windowRef = window.open(u.toString(), "_blank", getPopupFeatures());
        return awaitReq<T>(pid, windowRef);
      }
    } else {
      // if popups preferred, check for popup flows first, then check for redirect flow

      if (allowedInteractions.includes(ALLOWED_INTERACTIONS.POPUP)) {
        const u = new URL(
          constructURL({
            baseURL: popupUrl,
            hash: { b64Params: jsonToBase64(params[0]), _pid: pid, _method: method },
          })
        );
        const windowRef = window.open(u.toString(), "_blank", getPopupFeatures());
        return awaitReq<T>(pid, windowRef);
      }

      if (allowedInteractions.includes(ALLOWED_INTERACTIONS.REDIRECT)) {
        // give time for synchronous methods to complete before redirect
        setTimeout(() => {
          window.location.href = constructURL({
            baseURL: startUrl,
            hash: { b64Params: jsonToBase64(params[0]), _pid: pid, _method: method },
          });
        }, 50);
        return null;
      }
    }

    throw new Error("no matching allowed interactions");
  }

  _syncState(newState: Partial<OpenLoginState>): void {
    this.state = { ...this.state, ...newState, store: newState.store ? { ...newState.store } : { ...this.state.store } };
  }

  async encrypt(message: Buffer, privateKey?: string): Promise<Ecies> {
    let privKey = privateKey;
    if (!privKey) {
      privKey = this.privKey;
    }
    // validations
    if (!/^[0-9a-fA-f]{64}$/.exec(privKey)) {
      if (privKey === "" || privKey === undefined) {
        throw new Error("private key cannot be empty");
      } else {
        throw new Error("invalid private key in encrypt");
      }
    }
    return encrypt(getPublic(Buffer.from(privKey, "hex")), message);
  }

  async decrypt(ciphertext: Ecies, privateKey?: string): Promise<Buffer> {
    let privKey = privateKey;
    if (!privKey) {
      privKey = this.privKey;
    }
    // validations
    if (!/^[0-9a-fA-f]{64}$/.exec(privKey)) {
      if (privKey === "" || privKey === undefined) {
        throw new Error("private key cannot be empty");
      } else {
        throw new Error("invalid private key in decrypt");
      }
    }
    return decrypt(Buffer.from(privKey, "hex"), ciphertext);
  }

  async getUserInfo(): Promise<OpenloginUserInfo> {
    if (this.privKey) {
      const storeData = this.state.store;
      const userInfo: OpenloginUserInfo = {
        email: (storeData.email as string) || "",
        name: (storeData.name as string) || "",
        profileImage: (storeData.profileImage as string) || "",
        aggregateVerifier: (storeData.aggregateVerifier as string) || "",
        verifier: (storeData.verifier as string) || "",
        verifierId: (storeData.verifierId as string) || "",
        typeOfLogin: (storeData.typeOfLogin as LOGIN_PROVIDER_TYPE | CUSTOM_LOGIN_PROVIDER_TYPE) || "",
        dappShare: (storeData.dappShare as string) || "",
        idToken: (storeData.idToken as string) || "",
        oAuthIdToken: (storeData.oAuthIdToken as string) || "",
        oAuthAccessToken: (storeData.oAuthAccessToken as string) || "",
      };

      return userInfo;
    }
    throw new Error("user should be logged in to fetch userInfo");
  }

  async getEncodedLoginUrl(loginParams: LoginParams & Partial<BaseRedirectParams>): Promise<string> {
    const { redirectUrl } = loginParams;
    const { clientId } = this.state;
    if (!this.state.originData[origin]) {
      await this.updateOriginData();
    }
    const dataObject = {
      _clientId: clientId,
      _origin: new URL(redirectUrl).origin,
      _originData: this.state.originData,
      redirectUrl,
      ...loginParams,
    };

    const b64Params = jsonToBase64(dataObject);
    const hashParams = {
      b64Params,
      _method: "openlogin_login",
    };

    return constructURL({ baseURL: `${this.state.iframeUrl}/start`, hash: hashParams });
  }

  private async _authorizeSession(key: string): Promise<OpenloginSessionData> {
    try {
      if (!key) return {};
      const result = await this.sessionManager.authorizeSession(key);
      return result;
    } catch (err) {
      log.error("authorization failed", err);
      return {};
    }
  }
}

export default OpenLogin;
