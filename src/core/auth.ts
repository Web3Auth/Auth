import { SESSION_SERVER_API_URL, SESSION_SERVER_SOCKET_URL } from "@toruslabs/constants";
import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE, constructURL, getTimeout, UX_MODE } from "@toruslabs/customauth";
import { AuthSessionManager, SessionManager as StorageManager } from "@toruslabs/session-manager";
import { klona } from "klona/json";

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
  type AuthFlowResult,
  AuthOptions,
  AuthRequestPayload,
  AuthSessionData,
  AuthUserInfo,
  BaseLoginParams,
  BUILD_ENV,
  BUILD_ENV_TYPE,
  CITADEL_SERVER_URL_DEVELOPMENT,
  CITADEL_SERVER_URL_PRODUCTION,
  CITADEL_SERVER_URL_STAGING,
  CITADEL_SERVER_URL_TESTING,
  DEFAULT_SESSION_TIME,
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
import PopupHandler from "./PopupHandler";
import { getHashQueryParams, isAuthFlowError, version } from "./utils";

export class Auth {
  state: AuthSessionData = {};

  options: AuthOptions;

  private sessionManager: AuthSessionManager<AuthSessionData>;

  private _storageBaseKey = "auth_store";

  private dappState: string;

  private addVersionInUrls = true;

  private authProvider: AuthProvider;

  private authProviderPromise: Promise<void>;

  constructor(options: AuthOptions) {
    if (!options.clientId) throw InitializationError.invalidParams("clientId is required");
    if (!options.network) options.network = WEB3AUTH_NETWORK.SAPPHIRE_MAINNET;
    if (!options.buildEnv) options.buildEnv = BUILD_ENV.PRODUCTION;
    if (!options.sdkMode) options.sdkMode = SDK_MODE.DEFAULT;

    if (options.buildEnv === BUILD_ENV.DEVELOPMENT || options.buildEnv === BUILD_ENV.TESTING || options.sdkUrl) this.addVersionInUrls = false;
    if (!options.sdkUrl) {
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
    if (typeof options.includeUserDataInToken !== "boolean") options.includeUserDataInToken = true;
    if (!options.originData) options.originData = {};
    if (!options.whiteLabel) options.whiteLabel = {};
    if (!options.authConnectionConfig) options.authConnectionConfig = [];
    if (!options.mfaSettings) options.mfaSettings = {};
    if (!options.citadelServerUrl) options.citadelServerUrl = this.getDefaultCitadelServerUrl(options.buildEnv);
    if (!options.storageServerUrl) options.storageServerUrl = SESSION_SERVER_API_URL;
    if (!options.sessionSocketUrl) options.sessionSocketUrl = SESSION_SERVER_SOCKET_URL;
    if (!options.sessionTime) options.sessionTime = DEFAULT_SESSION_TIME;

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

  get appState(): string {
    return this.state.userInfo.appState || this.dappState || "";
  }

  get baseUrl(): string {
    // testing and develop don't have versioning
    if (!this.addVersionInUrls) return this.options.sdkUrl;
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
      this.options.sessionKey || (this.options.sessionNamespace ? `${this._storageBaseKey}_${this.options.sessionNamespace}` : this._storageBaseKey);

    this.sessionManager = new AuthSessionManager({
      storageKeyPrefix: storageKey,
      apiClientConfig: { baseURL: this.options.citadelServerUrl },
      storage: this.options.storage,
      accessTokenProvider: this.options.accessTokenProvider,
      cookieOptions: this.options.cookieOptions,
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
      await this.sessionManager.setTokens({
        session_id: params.sessionId,
        access_token: params.accessToken || "",
        refresh_token: params.refreshToken || "",
        id_token: params.idToken || "",
      });
    }

    // Get session id from the auth session manager
    const sessionId = await this.sessionManager.getSessionId();
    if (sessionId) {
      const data = await this._authorizeSession();
      // Fill state with correct info from session
      // If session is invalid all the data is unset here.
      if (data && Object.keys(data).length > 0) {
        this.updateState(data);
      }
    }

    if (this.options.sdkMode === SDK_MODE.IFRAME) {
      this.authProvider = new AuthProvider({ sdkUrl: this.baseUrl, whiteLabel: this.options.whiteLabel });
      if (!this.state.sessionId) {
        this.authProviderPromise = this.authProvider.init({ network: this.options.network, clientId: this.options.clientId });
        if (params.nonce) {
          await this.authProviderPromise;
          await this.postLoginInitiatedMessage(JSON.parse(params.loginParams), params.nonce);
        }
      }
    }
  }

  async login(params: LoginParams): Promise<{ privKey: string } | null> {
    if (!params.authConnection && (!params.authConnectionId || !params.groupedAuthConnectionId))
      throw LoginError.invalidLoginParams(`AuthConnection is required`);

    const loginParams: LoginParams = { ...params };

    const dataObject: AuthRequestPayload = {
      actionType: AUTH_ACTIONS.LOGIN,
      options: this.options,
      params: loginParams,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject, getTimeout(params.authConnection as AUTH_CONNECTION_TYPE));
    if (!result) return null;
    if (isAuthFlowError(result)) {
      this.dappState = result.state;
      throw LoginError.loginFailed(result.error);
    }
    await this.sessionManager.setTokens({
      session_id: result.sessionId,
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      id_token: result.idToken,
    });
    await this.rehydrateSession();
    return { privKey: this.privKey };
  }

  async postLoginInitiatedMessage(params: LoginParams, nonce?: string): Promise<void> {
    if (this.options.sdkMode !== SDK_MODE.IFRAME) throw LoginError.invalidLoginParams("Cannot perform this action in default mode.");
    // This is to ensure that the auth provider is initialized before calling postLoginInitiatedMessage
    // This is setup in the init method, if there is no active session.
    if (this.authProviderPromise) await this.authProviderPromise;

    // if there is an active session, we dont load the auth provider in the init method.
    // so we need to initialize it here, if user logged out and then login in again.
    if (!this.authProvider?.initialized) {
      await this.authProvider.init({ network: this.options.network, clientId: this.options.clientId });
    }

    const result = await this.authProvider.postLoginInitiatedMessage({ actionType: AUTH_ACTIONS.LOGIN, params, options: this.options }, nonce);
    await this.sessionManager.setTokens({
      session_id: result.sessionId,
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      id_token: result.idToken,
    });
    this.options.sessionNamespace = result.sessionNamespace;
    await this.rehydrateSession();
  }

  async postLoginCancelledMessage(nonce: string): Promise<void> {
    if (this.options.sdkMode !== SDK_MODE.IFRAME) throw LoginError.invalidLoginParams("Cannot perform this action in default mode.");
    if (this.authProviderPromise) await this.authProviderPromise;

    if (!this.authProvider?.initialized) throw InitializationError.notInitialized();

    this.authProvider.postLoginCancelledMessage(nonce);
  }

  async logout(): Promise<void> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();
    await this.sessionManager.logout();
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
      signatures: [],
    });
  }

  async enableMFA(params: Partial<LoginParams>): Promise<boolean> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();
    if (this.state.userInfo.isMfaEnabled) throw LoginError.mfaAlreadyEnabled();

    const dataObject: AuthRequestPayload = {
      actionType: AUTH_ACTIONS.ENABLE_MFA,
      options: { ...this.options, sdkMode: SDK_MODE.DEFAULT },
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
    if (!result) return null;
    if (isAuthFlowError(result)) {
      this.dappState = result.state;
      throw LoginError.loginFailed(result.error);
    }
    await this.sessionManager.setTokens({
      session_id: result.sessionId,
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      id_token: result.idToken,
    });
    await this.rehydrateSession();
    return Boolean(this.state.userInfo?.isMfaEnabled);
  }

  async manageMFA(params: Partial<LoginParams>): Promise<void> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();
    if (!this.state.userInfo.isMfaEnabled) throw LoginError.mfaNotEnabled();

    // in case of redirect mode, redirect url will be dapp specified
    // in case of popup mode, redirect url will be sdk specified
    const defaultParams = {
      dappUrl: `${window.location.origin}${window.location.pathname}`,
    };

    const loginId = StorageManager.generateRandomSessionKey();

    const dataObject: AuthRequestPayload = {
      actionType: AUTH_ACTIONS.MANAGE_MFA,
      // manage mfa always opens in a new tab, so need to fix the uxMode to redirect.
      options: {
        ...this.options,
        uxMode: UX_MODE.REDIRECT,
        sdkMode: SDK_MODE.DEFAULT,
        redirectUrl: `${this.dashboardUrl}/wallet/account`,
      },
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

    this.storeAuthPayload(loginId, dataObject, dataObject.options.sessionTime, true);
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

    const dataObject: AuthRequestPayload = {
      actionType,
      options: { ...this.options, sdkMode: SDK_MODE.DEFAULT },
      params: {
        ...params,
      },
      sessionId: this.sessionId,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject);
    if (!result) return undefined;
    if (isAuthFlowError(result)) return false;
    return true;
  }

  async addAuthenticatorFactor(params: Pick<LoginParams, "appState">): Promise<boolean> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();

    const dataObject: AuthRequestPayload = {
      actionType: AUTH_ACTIONS.ADD_AUTHENTICATOR_FACTOR,
      options: { ...this.options, sdkMode: SDK_MODE.DEFAULT },
      params: {
        ...params,
        authConnection: AUTH_CONNECTION.AUTHENTICATOR,
      },
      sessionId: this.sessionId,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject);
    if (!result) return undefined;
    if (isAuthFlowError(result)) return false;
    return true;
  }

  async addPasskeyFactor(params: Pick<LoginParams, "appState">): Promise<boolean> {
    if (!this.sessionId) throw LoginError.userNotLoggedIn();

    const dataObject: AuthRequestPayload = {
      actionType: AUTH_ACTIONS.ADD_PASSKEY_FACTOR,
      options: { ...this.options, sdkMode: SDK_MODE.DEFAULT },
      params: {
        ...params,
        authConnection: AUTH_CONNECTION.PASSKEYS,
      },
      sessionId: this.sessionId,
    };

    const result = await this.authHandler(`${this.baseUrl}/start`, dataObject);
    if (!result) return undefined;
    if (isAuthFlowError(result)) return false;
    return true;
  }

  async cleanup() {
    if (this.authProvider) this.authProvider.cleanup();
  }

  getUserInfo(): AuthUserInfo {
    if (!this.sessionId) {
      throw LoginError.userNotLoggedIn();
    }
    return this.state.userInfo;
  }

  private getDefaultCitadelServerUrl(buildEnv: BUILD_ENV_TYPE): string {
    if (buildEnv === BUILD_ENV.PRODUCTION) return CITADEL_SERVER_URL_PRODUCTION;
    if (buildEnv === BUILD_ENV.STAGING) return CITADEL_SERVER_URL_STAGING;
    if (buildEnv === BUILD_ENV.TESTING) return CITADEL_SERVER_URL_TESTING;
    if (buildEnv === BUILD_ENV.DEVELOPMENT) return CITADEL_SERVER_URL_DEVELOPMENT;
    return CITADEL_SERVER_URL_PRODUCTION;
  }

  private async storeAuthPayload(loginId: string, payload: AuthRequestPayload, timeout = 600, skipAwait = false): Promise<void> {
    if (!this.sessionManager) throw InitializationError.notInitialized();

    const authRequestStorageManager = new StorageManager<AuthRequestPayload>({
      sessionServerBaseUrl: payload.options.storageServerUrl,
      sessionNamespace: payload.options.sessionNamespace,
      sessionTime: timeout, // each login key must be used with 10 mins (might be used at the end of popup redirect)
      sessionId: loginId,
      allowedOrigin: this.options.sdkUrl,
    });

    const promise = authRequestStorageManager.createSession(klona(payload));

    if (payload.options.uxMode === UX_MODE.REDIRECT && !skipAwait) {
      await promise;
    }
  }

  private async _authorizeSession(): Promise<AuthSessionData> {
    try {
      const result = await this.sessionManager.authorize();
      return result;
    } catch (err) {
      log.error("authorization failed", err);
      return null;
    }
  }

  private updateState(data: Partial<AuthSessionData>) {
    this.state = { ...this.state, ...data };
  }

  private async rehydrateSession(): Promise<void> {
    const result = await this._authorizeSession();
    if (!result) return;
    this.updateState(result);
  }

  private async authHandler(url: string, dataObject: AuthRequestPayload, popupTimeout = 1000 * 10): Promise<AuthFlowResult | undefined> {
    const loginId = StorageManager.generateRandomSessionKey();
    await this.storeAuthPayload(loginId, dataObject);
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
      serverUrl: this.options.storageServerUrl,
      socketUrl: this.options.sessionSocketUrl,
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
