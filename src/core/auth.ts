import { SESSION_SERVER_API_URL, SESSION_SERVER_SOCKET_URL } from "@toruslabs/constants";
import { SessionManager } from "@toruslabs/session-manager";

import {
  AUTH_ACTIONS,
  AUTH_ACTIONS_TYPE,
  AuthOptions,
  AuthSessionConfig,
  AuthSessionData,
  AuthUserInfo,
  BaseLoginParams,
  BaseRedirectParams,
  BrowserStorage,
  BUILD_ENV,
  jsonToBase64,
  LOGIN_PROVIDER,
  LoginParams,
  SocialMfaModParams,
  UX_MODE,
  WEB3AUTH_LEGACY_NETWORK,
  type WEB3AUTH_LEGACY_NETWORK_TYPE,
  WEB3AUTH_NETWORK,
} from "../utils";
import { loglevel as log } from "../utils/logger";
import { InitializationError, LoginError } from "./errors";
import PopupHandler, { PopupResponse } from "./PopupHandler";
import { constructURL, getHashQueryParams, getTimeout, version } from "./utils";

export class Auth {
  state: AuthSessionData = {};

  options: AuthOptions;

  private sessionManager: SessionManager<AuthSessionData>;

  private currentStorage: BrowserStorage;

  private _storageBaseKey = "auth_store";

  private dappState: string;

  private addVersionInUrls = true;

  constructor(options: AuthOptions) {
    if (!options.clientId) throw InitializationError.invalidParams("clientId is required");
    if (!options.network) options.network = WEB3AUTH_NETWORK.SAPPHIRE_MAINNET;
    if (!options.buildEnv) options.buildEnv = BUILD_ENV.PRODUCTION;
    if (options.buildEnv === BUILD_ENV.DEVELOPMENT || options.buildEnv === BUILD_ENV.TESTING || options.sdkUrl) this.addVersionInUrls = false;
    if (!options.sdkUrl && !options.useMpc) {
      if (options.buildEnv === BUILD_ENV.DEVELOPMENT) {
        options.sdkUrl = "http://localhost:3000";
        options.dashboardUrl = "http://localhost:5173";
      } else if (options.buildEnv === BUILD_ENV.STAGING) {
        options.sdkUrl = "https://staging-auth.web3auth.io";
        options.dashboardUrl = "https://staging-account.web3auth.io";
      } else if (options.buildEnv === BUILD_ENV.TESTING) {
        options.sdkUrl = "https://develop-auth.web3auth.io";
        options.dashboardUrl = "https://develop-account.web3auth.io";
      } else {
        options.sdkUrl = "https://auth.web3auth.io";
        options.dashboardUrl = "https://account.web3auth.io";
      }
    }

    if (options.useMpc && !options.sdkUrl) {
      if (Object.values(WEB3AUTH_LEGACY_NETWORK).includes(options.network as WEB3AUTH_LEGACY_NETWORK_TYPE))
        throw InitializationError.invalidParams("MPC is not supported on legacy networks, please use sapphire_devnet or sapphire_mainnet.");
      if (options.buildEnv === BUILD_ENV.DEVELOPMENT) {
        options.sdkUrl = "http://localhost:3000";
      } else if (options.buildEnv === BUILD_ENV.STAGING) {
        options.sdkUrl = "https://staging-mpc-auth.web3auth.io";
      } else if (options.buildEnv === BUILD_ENV.TESTING) {
        options.sdkUrl = "https://develop-mpc-auth.web3auth.io";
      } else {
        options.sdkUrl = "https://mpc-auth.web3auth.io";
      }
    }

    if (!options.redirectUrl && typeof window !== "undefined") {
      options.redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }
    if (!options.uxMode) options.uxMode = UX_MODE.REDIRECT;
    if (typeof options.replaceUrlOnRedirect !== "boolean") options.replaceUrlOnRedirect = true;
    if (!options.originData) options.originData = {};
    if (!options.whiteLabel) options.whiteLabel = {};
    if (!options.loginConfig) options.loginConfig = {};
    if (!options.mfaSettings) options.mfaSettings = {};
    if (!options.storageServerUrl) options.storageServerUrl = SESSION_SERVER_API_URL;
    if (!options.sessionSocketUrl) options.sessionSocketUrl = SESSION_SERVER_SOCKET_URL;
    if (!options.storageKey) options.storageKey = "local";
    if (!options.webauthnTransports) options.webauthnTransports = ["internal"];
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

  private get baseUrl(): string {
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

    const storageKey = this.options.sessionNamespace ? `${this._storageBaseKey}_${this.options.sessionNamespace}` : this._storageBaseKey;
    this.currentStorage = BrowserStorage.getInstance(storageKey, this.options.storageKey);

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
      }
    }
  }

  async login(params: LoginParams & Partial<BaseRedirectParams>): Promise<{ privKey: string } | null> {
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

    const dataObject: AuthSessionConfig = {
      actionType: AUTH_ACTIONS.LOGIN,
      options: this.options,
      params: loginParams,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject, getTimeout(params.loginProvider));
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
        verifier: "",
        verifierId: "",
        aggregateVerifier: "",
        typeOfLogin: "",
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
    // in case of redirect mode, redirect url will be dapp specified
    // in case of popup mode, redirect url will be sdk specified
    const defaultParams: BaseRedirectParams = {
      redirectUrl: this.options.redirectUrl,
    };

    const dataObject: AuthSessionConfig = {
      actionType: AUTH_ACTIONS.ENABLE_MFA,
      options: this.options,
      params: {
        ...defaultParams,
        ...params,
        loginProvider: this.state.userInfo.typeOfLogin,
        extraLoginOptions: {
          login_hint: this.state.userInfo.verifierId,
        },
        mfaLevel: "mandatory",
      },
      sessionId: this.sessionId,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject, getTimeout(dataObject.params.loginProvider));
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
      options: this.options,
      params: {
        ...defaultParams,
        ...params,
        loginProvider: this.state.userInfo.typeOfLogin,
        extraLoginOptions: {
          login_hint: this.state.userInfo.verifierId,
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

  async manageSocialFactor(actionType: AUTH_ACTIONS_TYPE, params: SocialMfaModParams & Partial<BaseRedirectParams>): Promise<boolean> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();

    // in case of redirect mode, redirect url will be dapp specified
    // in case of popup mode, redirect url will be sdk specified
    const defaultParams: BaseRedirectParams = {
      redirectUrl: this.options.redirectUrl,
    };

    const dataObject: AuthSessionConfig = {
      actionType,
      options: this.options,
      params: {
        ...defaultParams,
        ...params,
      },
      sessionId: this.sessionId,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject);
    if (this.options.uxMode === UX_MODE.REDIRECT) return undefined;
    if (result.error) return false;
    return true;
  }

  async addAuthenticatorFactor(params: Partial<BaseRedirectParams>): Promise<boolean> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();

    // in case of redirect mode, redirect url will be dapp specified
    // in case of popup mode, redirect url will be sdk specified
    const defaultParams: BaseRedirectParams = {
      redirectUrl: this.options.redirectUrl,
    };

    const dataObject: AuthSessionConfig = {
      actionType: AUTH_ACTIONS.ADD_AUTHENTICATOR_FACTOR,
      options: this.options,
      params: {
        ...defaultParams,
        ...params,
        loginProvider: LOGIN_PROVIDER.AUTHENTICATOR,
      },
      sessionId: this.sessionId,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject);
    if (this.options.uxMode === UX_MODE.REDIRECT) return undefined;
    if (result.error) return false;
    return true;
  }

  async addPasskeyFactor(params: Partial<BaseRedirectParams>): Promise<boolean> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();

    // in case of redirect mode, redirect url will be dapp specified
    // in case of popup mode, redirect url will be sdk specified
    const defaultParams: BaseRedirectParams = {
      redirectUrl: this.options.redirectUrl,
    };

    const dataObject: AuthSessionConfig = {
      actionType: AUTH_ACTIONS.ADD_PASSKEY_FACTOR,
      options: this.options,
      params: {
        ...defaultParams,
        ...params,
        loginProvider: LOGIN_PROVIDER.PASSKEYS,
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
