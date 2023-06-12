import { OpenloginSessionManager } from "@toruslabs/openlogin-session-manager";
import {
  BaseLoginParams,
  BaseRedirectParams,
  BrowserStorage,
  jsonToBase64,
  LoginParams,
  OPENLOGIN_NETWORK,
  OPENLOGIN_NETWORK_TYPE,
  OpenLoginOptions,
  OpenloginSessionConfig,
  OpenloginSessionData,
  OpenloginUserInfo,
  UX_MODE,
} from "@toruslabs/openlogin-utils";
import log from "loglevel";

import { InitializationError, LoginError } from "./errors";
import PopupHandler from "./PopupHandler";
import { constructURL, getHashQueryParams, version } from "./utils";

class OpenLogin {
  state: OpenloginSessionData = {};

  options: OpenLoginOptions;

  private versionSupportNetworks: OPENLOGIN_NETWORK_TYPE[] = [OPENLOGIN_NETWORK.MAINNET, OPENLOGIN_NETWORK.CYAN, OPENLOGIN_NETWORK.AQUA];

  private sessionManager: OpenloginSessionManager<OpenloginSessionData>;

  private currentStorage: BrowserStorage;

  private _storageBaseKey = "openlogin_store";

  constructor(options: OpenLoginOptions) {
    if (!options.clientId) throw InitializationError.invalidParams("clientId is required");
    if (!options.sdkUrl) {
      if (options.network === OPENLOGIN_NETWORK.MAINNET) {
        options.sdkUrl = "https://app.openlogin.com";
      } else if (options.network === OPENLOGIN_NETWORK.CYAN) {
        options.sdkUrl = "https://cyan.openlogin.com";
      } else if (options.network === OPENLOGIN_NETWORK.TESTNET) {
        options.sdkUrl = "https://testing.openlogin.com";
      } else if (options.network === OPENLOGIN_NETWORK.AQUA) {
        options.sdkUrl = "https://aqua.openlogin.com";
      } else if (options.network === OPENLOGIN_NETWORK.DEVELOPMENT) {
        options.sdkUrl = "http://localhost:3000";
      }
    }
    if (!options.sdkUrl) {
      throw InitializationError.invalidParams("network or sdk url");
    }

    if (!options.redirectUrl) {
      options.redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }

    if (!options.uxMode) options.uxMode = UX_MODE.REDIRECT;
    if (typeof options.replaceUrlOnRedirect !== "boolean") options.replaceUrlOnRedirect = true;
    if (!options.originData) options.originData = {};
    if (!options.whiteLabel) options.whiteLabel = {};
    if (!options.loginConfig) options.loginConfig = {};
    if (!options.mfaSettings) options.mfaSettings = {};
    if (!options.storageServerUrl) options.storageServerUrl = "https://broadcast-server.tor.us";
    if (!options.storageKey) options.storageKey = "local";
    if (!options.webauthnTransports) options.webauthnTransports = ["internal"];
    if (!options.sessionTime) options.sessionTime = 86400;

    this.options = options;
  }

  get privKey(): string {
    return this.state.privKey ? this.state.privKey.padStart(64, "0") : "";
  }

  get coreKitKey(): string {
    return this.state.coreKitKey ? this.state.coreKitKey.padStart(64, "0") : "";
  }

  get ed25519PrivKey(): string {
    return this.state.ed25519PrivKey ? this.state.ed25519PrivKey.padStart(128, "0") : "";
  }

  get coreKitEd25519Key(): string {
    return this.state.coreKitEd25519PrivKey ? this.state.coreKitEd25519PrivKey.padStart(128, "0") : "";
  }

  get sessionId(): string {
    return this.state.sessionId || "";
  }

  get sessionNamespace(): string {
    return this.options.sessionNamespace || "";
  }

  async init(): Promise<void> {
    // get sessionNamespace from the redirect result.
    const params = getHashQueryParams(this.options.replaceUrlOnRedirect);
    if (params.sessionNamespace) this.options.sessionNamespace = params.sessionNamespace;

    const storageKey = this.options.sessionNamespace ? `${this._storageBaseKey}_${this.options.sessionNamespace}` : this._storageBaseKey;
    this.currentStorage = BrowserStorage.getInstance(storageKey, this.options.storageKey);

    const sessionId = this.currentStorage.get<string>("sessionId");

    this.sessionManager = new OpenloginSessionManager({
      sessionServerBaseUrl: this.options.storageServerUrl,
      sessionNamespace: this.options.sessionNamespace,
      sessionTime: this.options.sessionTime,
      sessionId,
    });

    if (this.options.network === OPENLOGIN_NETWORK.TESTNET) {
      // using console log because it shouldn't be affected by loglevel config
      // eslint-disable-next-line no-console
      console.log("%c WARNING! You are on testnet. Please set network: 'mainnet' in production", "color: #FF0000");
    }

    if (params.error) {
      throw LoginError.loginFailed(params.error);
    }

    if (params.sessionId) {
      this.currentStorage.set("sessionId", params.sessionId);
      this.sessionManager.sessionKey = params.sessionId;
    }

    if (this.sessionManager.sessionKey) {
      const data = await this._authorizeSession();
      // Fill state with correct info from session
      // If session is invalid all the data is unset here.
      this.updateState(data);
      if (Object.keys(data).length === 0) {
        // If session is invalid, unset the sessionId from localStorage.
        this.currentStorage.set("sessionId", "");
      }
    }
  }

  async login(params: LoginParams & Partial<BaseRedirectParams>): Promise<{ privKey: string }> {
    if (!params.loginProvider) throw LoginError.invalidLoginParams(`loginProvider is required`);

    // in case of redirect mode, redirect url will be dapp specified
    // in case of popup mode, redirect url will be sdk specified
    const defaultParams: BaseRedirectParams = {
      redirectUrl: this.options.redirectUrl,
    };

    const loginParams: LoginParams = {
      loginProvider: params.loginProvider,
      ...defaultParams,
      ...params,
    };
    // do this in popup-window route
    // loginParams.redirectUrl = this.options.uxMode === UX_MODE.POPUP ? `${this.options.sdkUrl}/popup-window` : loginParams.redirectUrl;

    const base64url = this.getBaseUrl();

    // construct the url to open for either popup/redirect mode and call request method to handle the rest
    const loginId = await this.getLoginId(loginParams);
    const configParams: BaseLoginParams = {
      loginId,
      sessionNamespace: this.options.sessionNamespace,
    };

    if (this.options.uxMode === UX_MODE.REDIRECT) {
      const loginUrl = constructURL({
        baseURL: base64url,
        hash: { b64Params: jsonToBase64(configParams) },
      });
      window.location.href = loginUrl;
      return undefined;
    }
    return new Promise((resolve, reject) => {
      const loginUrl = constructURL({
        baseURL: base64url,
        hash: { b64Params: jsonToBase64(configParams) },
      });
      const currentWindow = new PopupHandler({ url: loginUrl });

      currentWindow.on("close", () => {
        reject(LoginError.popupClosed());
      });

      currentWindow
        .listenOnChannel(loginId)
        .then(({ sessionId, sessionNamespace }) => {
          this.sessionManager.sessionKey = sessionId;
          this.options.sessionNamespace = sessionNamespace;
          this.currentStorage.set("sessionId", sessionId);
          return this.sessionManager.authorizeSession();
        })
        .then((sessionData: OpenloginSessionData) => {
          this.updateState(sessionData);
          return resolve({ privKey: this.privKey });
        })
        .catch(reject);

      currentWindow.open();
    });
  }

  async logout(): Promise<void> {
    if (!this.sessionManager.sessionKey) throw LoginError.userNotLoggedIn();
    await this.sessionManager.invalidateSession();
    this.updateState({
      privKey: "",
      coreKitKey: "",
      coreKitEd25519PrivKey: "",
      ed25519PrivKey: "",
      walletKey: "",
      oAuthPrivateKey: "",
      tKey: "",
      userInfo: {
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

    this.currentStorage.set("sessionId", "");
  }

  getUserInfo(): OpenloginUserInfo {
    if (!this.sessionManager.sessionKey) {
      throw LoginError.userNotLoggedIn();
    }
    return this.state.userInfo;
  }

  async getLoginId(loginParams: LoginParams & Partial<BaseRedirectParams>): Promise<string> {
    if (!this.sessionManager) throw InitializationError.notInitialized();
    const dataObject: OpenloginSessionConfig = {
      options: this.options,
      params: loginParams,
    };

    const loginId = OpenloginSessionManager.generateRandomSessionKey();
    const loginSessionMgr = new OpenloginSessionManager<OpenloginSessionConfig>({
      sessionServerBaseUrl: this.options.storageServerUrl,
      sessionNamespace: this.options.sessionNamespace,
      sessionTime: 600, // each login key must be used with 10 mins (might be used at the end of popup redirect)
      sessionId: loginId,
    });

    await loginSessionMgr.createSession(JSON.parse(JSON.stringify(dataObject)));

    return loginId;
  }

  private async _authorizeSession(): Promise<OpenloginSessionData> {
    try {
      if (!this.sessionManager.sessionKey) return {};
      const result = await this.sessionManager.authorizeSession();
      return result;
    } catch (err) {
      log.error("authorization failed", err);
      return {};
    }
  }

  private updateState(data: Partial<OpenloginSessionData>) {
    this.state = { ...this.state, ...data };
  }

  private getBaseUrl(): string {
    if (this.versionSupportNetworks.includes(this.options.network)) {
      return `${this.options.sdkUrl}/v${version.split(".")[0]}/start`;
    }
    return `${this.options.sdkUrl}/start`;
  }
}

export default OpenLogin;
