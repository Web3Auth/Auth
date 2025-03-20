import { SESSION_SERVER_API_URL, SESSION_SERVER_SOCKET_URL } from "@toruslabs/constants";
import { AUTH_CONNECTION, constructURL, UX_MODE } from "@toruslabs/customauth";
import { SessionManager } from "@toruslabs/session-manager";

import {
  AUTH_ACTIONS,
  AUTH_ACTIONS_TYPE,
  AUTH_DASHBOARD_DEVELOPMENT_URL,
  AUTH_DASHBOARD_PRODUCTION_URL,
  AUTH_DASHBOARD_STAGING_URL,
  AUTH_DASHBOARD_TESTING_URL,
  AUTH_SERVICE_DEVELOPMENT_URL,
  AUTH_SERVICE_PRODUCTION_URL,
  AUTH_SERVICE_STAGING_URL,
  AUTH_SERVICE_TESTING_URL,
  AuthOptions,
  AuthSessionConfig,
  AuthSessionData,
  AuthUserInfo,
  BaseLoginParams,
  BrowserStorage,
  BUILD_ENV,
  jsonToBase64,
  LoginParams,
  POPUP_TIMEOUT,
  SDK_MODE,
  SocialMfaModParams,
  WEB3AUTH_NETWORK,
} from "../utils";
import { log } from "../utils/logger";
import { AuthProvider } from "./AuthProvider";
import { InitializationError, LoginError } from "./errors";
import PopupHandler, { PopupResponse } from "./PopupHandler";
import { getHashQueryParams, version } from "./utils";

export class Auth {
  state: AuthSessionData = {};

  options: AuthOptions;

  private sessionManager: SessionManager<AuthSessionData>;

  private currentStorage: BrowserStorage;

  private _storageBaseKey = "auth_store";

  private dappState: string;

  private addVersionInUrls = true;

  private authProvider: AuthProvider;

  constructor(options: AuthOptions) {
    if (!options.clientId) throw InitializationError.invalidParams("clientId is required");
    if (!options.network) options.network = WEB3AUTH_NETWORK.SAPPHIRE_MAINNET;
    if (!options.buildEnv) options.buildEnv = BUILD_ENV.PRODUCTION;
    if (!options.sdkMode) options.sdkMode = SDK_MODE.DEFAULT;

    // TODO: move all urls to constants
    if (options.buildEnv === BUILD_ENV.DEVELOPMENT || options.buildEnv === BUILD_ENV.TESTING || options.sdkUrl) this.addVersionInUrls = false;
    if (!options.sdkUrl && !options.useMpc) {
      if (options.buildEnv === BUILD_ENV.DEVELOPMENT) {
        options.sdkUrl = AUTH_SERVICE_DEVELOPMENT_URL;
        options.dashboardUrl = AUTH_DASHBOARD_DEVELOPMENT_URL;
      } else if (options.buildEnv === BUILD_ENV.STAGING) {
        options.sdkUrl = AUTH_SERVICE_STAGING_URL;
        options.dashboardUrl = AUTH_DASHBOARD_STAGING_URL;
      } else if (options.buildEnv === BUILD_ENV.TESTING) {
        options.sdkUrl = AUTH_SERVICE_TESTING_URL;
        options.dashboardUrl = AUTH_DASHBOARD_TESTING_URL;
      } else {
        options.sdkUrl = AUTH_SERVICE_PRODUCTION_URL;
        options.dashboardUrl = AUTH_DASHBOARD_PRODUCTION_URL;
      }
    }

    if (!options.redirectUrl && typeof window !== "undefined") {
      options.redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }
    if (!options.uxMode) options.uxMode = UX_MODE.REDIRECT;
    if (typeof options.replaceUrlOnRedirect !== "boolean") options.replaceUrlOnRedirect = true;
    if (!options.originData) options.originData = {};
    if (!options.whiteLabel) options.whiteLabel = {};
    if (!options.authConnectionConfig) options.authConnectionConfig = [];
    if (!options.mfaSettings) options.mfaSettings = {};
    if (!options.storageServerUrl) options.storageServerUrl = SESSION_SERVER_API_URL;
    if (!options.sessionSocketUrl) options.sessionSocketUrl = SESSION_SERVER_SOCKET_URL;
    if (!options.storage) options.storage = "local";
    if (!options.sessionTime) options.sessionTime = 86400;

    this.options = options;
  }

  get privKey(): string {
    if (this.options.useMpc) return this.state.factorKey || "";
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

  get appState(): string {
    return this.state.userInfo.appState || this.dappState || "";
  }

  get baseUrl(): string {
    // testing and develop don't have versioning
    if (!this.addVersionInUrls) return `${this.options.sdkUrl}`;
    return `${this.options.sdkUrl}/v${version.split(".")[0]}`;
  }

  private get dashboardUrl(): string {
    // testing and develop don't have versioning
    if (!this.addVersionInUrls) return `${this.options.dashboardUrl}`;
    return `${this.options.dashboardUrl}/v${version.split(".")[0]}`;
  }

  async init(): Promise<void> {
    // get sessionNamespace from the redirect result.
    const params = getHashQueryParams(this.options.replaceUrlOnRedirect);
    if (params.sessionNamespace) this.options.sessionNamespace = params.sessionNamespace;

    const storageKey =
      this.options.sessionKey || this.options.sessionNamespace ? `${this._storageBaseKey}_${this.options.sessionNamespace}` : this._storageBaseKey;
    this.currentStorage = BrowserStorage.getInstance(storageKey, this.options.storage);

    const sessionId = this.currentStorage.get<string>("sessionId");

    this.sessionManager = new SessionManager({
      sessionServerBaseUrl: this.options.storageServerUrl,
      sessionNamespace: this.options.sessionNamespace,
      sessionTime: this.options.sessionTime,
      sessionId,
      allowedOrigin: this.options.sdkUrl,
    });

    if (this.options.network === WEB3AUTH_NETWORK.TESTNET || this.options.network === WEB3AUTH_NETWORK.SAPPHIRE_DEVNET) {
      // using console log because it shouldn't be affected by loglevel config
      // eslint-disable-next-line no-console
      console.log(
        `%c WARNING! You are on ${this.options.network}. Please set network: 'mainnet' or 'sapphire_mainnet' in production`,
        "color: #FF0000"
      );
    }

    if (this.options.buildEnv !== BUILD_ENV.PRODUCTION) {
      // using console log because it shouldn't be affected by loglevel config
      // eslint-disable-next-line no-console
      console.log(`%c WARNING! You are using build env ${this.options.buildEnv}. Please set buildEnv: 'production' in production`, "color: #FF0000");
    }

    if (params.error) {
      this.dappState = params.state;
      throw LoginError.loginFailed(params.error);
    }

    if (params.sessionId) {
      this.currentStorage.set("sessionId", params.sessionId);
      this.sessionManager.sessionId = params.sessionId;
    }

    if (this.sessionManager.sessionId) {
      const data = await this._authorizeSession();
      // Fill state with correct info from session
      // If session is invalid all the data is unset here.
      this.updateState(data);
      if (Object.keys(data).length === 0) {
        // If session is invalid, unset the sessionId from localStorage.
        this.currentStorage.set("sessionId", "");
      } else {
        this.updateState({ sessionId: this.sessionManager.sessionId });
      }
    }

    if (this.options.sdkMode === SDK_MODE.IFRAME) {
      this.authProvider = new AuthProvider({ sdkUrl: this.options.sdkUrl, whiteLabel: this.options.whiteLabel });
      if (!this.state.sessionId) {
        await this.authProvider.init({ network: this.options.network, clientId: this.options.clientId });
        if (params.nonce) {
          await this.postLoginInitiatedMessage(JSON.parse(params.loginParams), params.nonce);
        }
      }
    }
  }

  async login(params: LoginParams): Promise<{ privKey: string } | null> {
    if (!params.authConnection && (!params.authConnectionId || !params.groupedAuthConnectionId))
      throw LoginError.invalidLoginParams(`AuthConnection is required`);

    const loginParams: LoginParams = { ...params };

    const dataObject: AuthSessionConfig = {
      actionType: AUTH_ACTIONS.LOGIN,
      options: this.options,
      params: loginParams,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject, POPUP_TIMEOUT);
    if (this.options.uxMode === UX_MODE.REDIRECT) return null;
    if (result.error) {
      this.dappState = result.state;
      throw LoginError.loginFailed(result.error);
    }
    this.sessionManager.sessionId = result.sessionId;
    this.options.sessionNamespace = result.sessionNamespace;
    this.currentStorage.set("sessionId", result.sessionId);
    await this.rehydrateSession();
    return { privKey: this.privKey };
  }

  async postLoginInitiatedMessage(params: LoginParams, nonce?: string): Promise<void> {
    if (this.options.sdkMode !== SDK_MODE.IFRAME) throw LoginError.invalidLoginParams("Cannot perform this action in default mode.");

    if (!this.authProvider || !this.authProvider.initialized) {
      await this.authProvider.init({ network: this.options.network, clientId: this.options.clientId });
    }

    const result = await this.authProvider.postLoginInitiatedMessage({ actionType: AUTH_ACTIONS.LOGIN, params, options: this.options }, nonce);
    if (result.error) throw LoginError.loginFailed(result.error);
    this.sessionManager.sessionId = result.sessionId;
    this.options.sessionNamespace = result.sessionNamespace;
    this.currentStorage.set("sessionId", result.sessionId);
    await this.rehydrateSession();
  }

  async postLoginCancelledMessage(nonce: string): Promise<void> {
    if (this.options.sdkMode !== SDK_MODE.IFRAME) throw LoginError.invalidLoginParams("Cannot perform this action in default mode.");
    if (!this.authProvider || !this.authProvider.initialized) throw InitializationError.notInitialized();

    this.authProvider.postLoginCancelledMessage(nonce);
  }

  async logout(): Promise<void> {
    if (!this.sessionManager.sessionId) throw LoginError.userNotLoggedIn();
    await this.sessionManager.invalidateSession();
    this.updateState({
      privKey: "",
      coreKitKey: "",
      coreKitEd25519PrivKey: "",
      ed25519PrivKey: "",
      walletKey: "",
      oAuthPrivateKey: "",
      tKey: "",
      metadataNonce: "",
      keyMode: undefined,
      userInfo: {
        name: "",
        profileImage: "",
        dappShare: "",
        idToken: "",
        oAuthIdToken: "",
        oAuthAccessToken: "",
        appState: "",
        email: "",
        authConnectionId: "",
        userId: "",
        groupedAuthConnectionId: "",
        authConnection: "",
        isMfaEnabled: false,
      },
      authToken: "",
      sessionId: "",
      factorKey: "",
      signatures: [],
      tssShareIndex: -1,
      tssPubKey: "",
      tssShare: "",
      tssNonce: -1,
    });

    this.currentStorage.set("sessionId", "");
  }

  async enableMFA(params: Partial<LoginParams>): Promise<boolean> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();
    if (this.state.userInfo.isMfaEnabled) throw LoginError.mfaAlreadyEnabled();

    const dataObject: AuthSessionConfig = {
      actionType: AUTH_ACTIONS.ENABLE_MFA,
      options: this.options,
      params: {
        ...params,
        authConnection: this.state.userInfo.authConnection,
        authConnectionId: this.state.userInfo.authConnectionId,
        groupedAuthConnectionId: this.state.userInfo.groupedAuthConnectionId,
        extraLoginOptions: {
          login_hint: this.state.userInfo.userId,
        },
        mfaLevel: "mandatory",
      },
      sessionId: this.sessionId,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject, POPUP_TIMEOUT);
    if (this.options.uxMode === UX_MODE.REDIRECT) return null;
    if (result.error) {
      this.dappState = result.state;
      throw LoginError.loginFailed(result.error);
    }
    this.sessionManager.sessionId = result.sessionId;
    this.options.sessionNamespace = result.sessionNamespace;
    this.currentStorage.set("sessionId", result.sessionId);
    await this.rehydrateSession();
    return Boolean(this.state.userInfo?.isMfaEnabled);
  }

  async manageMFA(params: Partial<LoginParams>): Promise<void> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();
    if (!this.state.userInfo.isMfaEnabled) throw LoginError.mfaNotEnabled();

    // in case of redirect mode, redirect url will be dapp specified
    // in case of popup mode, redirect url will be sdk specified
    const defaultParams = {
      redirectUrl: `${this.dashboardUrl}/wallet/account`,
      dappUrl: `${window.location.origin}${window.location.pathname}`,
    };

    const loginId = SessionManager.generateRandomSessionKey();

    const dataObject: AuthSessionConfig = {
      actionType: AUTH_ACTIONS.MANAGE_MFA,
      // manage mfa always opens in a new tab, so need to fix the uxMode to redirect.
      options: { ...this.options, uxMode: "redirect" },
      params: {
        ...defaultParams,
        ...params,
        authConnection: this.state.userInfo.authConnection,
        authConnectionId: this.state.userInfo.authConnectionId,
        groupedAuthConnectionId: this.state.userInfo.groupedAuthConnectionId,
        extraLoginOptions: {
          login_hint: this.state.userInfo.userId,
        },
        appState: jsonToBase64({ loginId }),
      },
      sessionId: this.sessionId,
    };

    this.createLoginSession(loginId, dataObject, dataObject.options.sessionTime, true);
    const configParams: BaseLoginParams = {
      loginId,
      sessionNamespace: this.options.sessionNamespace,
      storageServerUrl: this.options.storageServerUrl,
    };

    const loginUrl = constructURL({
      baseURL: `${this.baseUrl}/start`,
      hash: { b64Params: jsonToBase64(configParams) },
    });

    window.open(loginUrl, "_blank");
  }

  async manageSocialFactor(actionType: AUTH_ACTIONS_TYPE, params: SocialMfaModParams & Pick<LoginParams, "appState">): Promise<boolean> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();

    const dataObject: AuthSessionConfig = {
      actionType,
      options: this.options,
      params: {
        ...params,
      },
      sessionId: this.sessionId,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject);
    if (this.options.uxMode === UX_MODE.REDIRECT) return undefined;
    if (result.error) return false;
    return true;
  }

  async addAuthenticatorFactor(params: Pick<LoginParams, "appState">): Promise<boolean> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();

    const dataObject: AuthSessionConfig = {
      actionType: AUTH_ACTIONS.ADD_AUTHENTICATOR_FACTOR,
      options: this.options,
      params: {
        ...params,
        authConnection: AUTH_CONNECTION.AUTHENTICATOR,
      },
      sessionId: this.sessionId,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject);
    if (this.options.uxMode === UX_MODE.REDIRECT) return undefined;
    if (result.error) return false;
    return true;
  }

  async addPasskeyFactor(params: Pick<LoginParams, "appState">): Promise<boolean> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();

    const dataObject: AuthSessionConfig = {
      actionType: AUTH_ACTIONS.ADD_PASSKEY_FACTOR,
      options: this.options,
      params: {
        ...params,
        authConnection: AUTH_CONNECTION.PASSKEYS,
      },
      sessionId: this.sessionId,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject);
    if (this.options.uxMode === UX_MODE.REDIRECT) return undefined;
    if (result.error) return false;
    return true;
  }

  getUserInfo(): AuthUserInfo {
    if (!this.sessionManager.sessionId) {
      throw LoginError.userNotLoggedIn();
    }
    return this.state.userInfo;
  }

  private async createLoginSession(loginId: string, data: AuthSessionConfig, timeout = 600, skipAwait = false): Promise<void> {
    if (!this.sessionManager) throw InitializationError.notInitialized();

    const loginSessionMgr = new SessionManager<AuthSessionConfig>({
      sessionServerBaseUrl: data.options.storageServerUrl,
      sessionNamespace: data.options.sessionNamespace,
      sessionTime: timeout, // each login key must be used with 10 mins (might be used at the end of popup redirect)
      sessionId: loginId,
      allowedOrigin: this.options.sdkUrl,
    });

    const promise = loginSessionMgr.createSession(JSON.parse(JSON.stringify(data)));

    if (data.options.uxMode === UX_MODE.REDIRECT && !skipAwait) {
      await promise;
    }
  }

  private async _authorizeSession(): Promise<AuthSessionData> {
    try {
      if (!this.sessionManager.sessionId) return {};
      const result = await this.sessionManager.authorizeSession();
      return result;
    } catch (err) {
      log.error("authorization failed", err);
      return {};
    }
  }

  private updateState(data: Partial<AuthSessionData>) {
    this.state = { ...this.state, ...data };
  }

  private async rehydrateSession(): Promise<void> {
    const result = await this._authorizeSession();
    this.updateState(result);
  }

  private async authHandler(url: string, dataObject: AuthSessionConfig, popupTimeout = 1000 * 10): Promise<PopupResponse | undefined> {
    const loginId = SessionManager.generateRandomSessionKey();
    await this.createLoginSession(loginId, dataObject);
    const configParams: BaseLoginParams = {
      loginId,
      sessionNamespace: this.options.sessionNamespace,
      storageServerUrl: this.options.storageServerUrl,
    };

    if (this.options.uxMode === UX_MODE.REDIRECT) {
      const loginUrl = constructURL({
        baseURL: url,
        hash: { b64Params: jsonToBase64(configParams) },
      });
      window.location.href = loginUrl;
      return undefined;
    }

    const loginUrl = constructURL({
      baseURL: url,
      hash: { b64Params: jsonToBase64(configParams) },
    });
    const currentWindow = new PopupHandler({
      url: loginUrl,
      timeout: popupTimeout,
      sessionServerUrl: this.options.storageServerUrl,
      sessionSocketUrl: this.options.sessionSocketUrl,
    });

    return new Promise((resolve, reject) => {
      currentWindow.on("close", () => {
        reject(LoginError.popupClosed());
      });

      currentWindow.listenOnChannel(loginId).then(resolve).catch(reject);

      try {
        currentWindow.open();
      } catch (error) {
        reject(error);
      }
    });
  }
}
