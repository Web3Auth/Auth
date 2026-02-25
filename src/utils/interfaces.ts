import { type TORUS_LEGACY_NETWORK_TYPE, type TORUS_SAPPHIRE_NETWORK_TYPE } from "@toruslabs/constants";
import type { AUTH_CONNECTION_TYPE, Auth0ClientOptions, UX_MODE_TYPE } from "@toruslabs/customauth";
import type { AccessTokenProvider, CookieOptions, StorageConfig } from "@toruslabs/session-manager";

import { AUTH_ACTIONS, BUILD_ENV, MFA_LEVELS, SDK_MODE, SUPPORTED_KEY_CURVES, WEB3AUTH_NETWORK } from "./constants";

export type WEB3AUTH_LEGACY_NETWORK_TYPE = TORUS_LEGACY_NETWORK_TYPE;
export type WEB3AUTH_SAPPHIRE_NETWORK_TYPE = TORUS_SAPPHIRE_NETWORK_TYPE;

export type OriginData = {
  [P in string]: string;
};

export type UserData = {
  [P in string]: string;
};

export type AUTH_ACTIONS_TYPE = (typeof AUTH_ACTIONS)[keyof typeof AUTH_ACTIONS];

// autocomplete workaround https://github.com/microsoft/TypeScript/issues/29729
export type CUSTOM_AUTH_CONNECTION_TYPE = string & { toString?: (radix?: number) => string };

export type MfaLevelType = (typeof MFA_LEVELS)[keyof typeof MFA_LEVELS];

export type SUPPORTED_KEY_CURVES_TYPE = (typeof SUPPORTED_KEY_CURVES)[keyof typeof SUPPORTED_KEY_CURVES];

export type WEB3AUTH_NETWORK_TYPE = (typeof WEB3AUTH_NETWORK)[keyof typeof WEB3AUTH_NETWORK];

export type BUILD_ENV_TYPE = (typeof BUILD_ENV)[keyof typeof BUILD_ENV];

export type SDK_MODE_TYPE = (typeof SDK_MODE)[keyof typeof SDK_MODE];

export type ExtraLoginOptions = Auth0ClientOptions;

export type LoginParams = {
  /**
   * Any custom state you wish to pass along. This will be returned to you post redirect.
   * Use this to store data that you want to be available to the dapp after login.
   */
  appState?: string;

  /**
   * The auth connection to be used for login.
   */
  authConnection: AUTH_CONNECTION_TYPE | CUSTOM_AUTH_CONNECTION_TYPE;

  /**
   * The auth connection id to be used for login.
   */
  authConnectionId?: string;

  /**
   * The grouped auth connection id to be used for login.
   */
  groupedAuthConnectionId?: string;

  /**
   * You can set the `mfaLevel` to customize when mfa screen should be shown to user.
   * It currently accepts 4 values:-
   * - `'default'`: Setting mfa level to `default` will present mfa screen to user on every third login.
   * - `'optional'`: Setting mfa level to `default` will present mfa screen to user on every login but user can skip it.
   * - `'mandatory'`: Setting mfa level to `mandatory` will make it mandatory for user to setup mfa after login.
   * - `'none'`: Setting mfa level to `none` will make the user skip the mfa setup screen
   *
   * Defaults to `none`
   * @defaultValue `none`
   */
  mfaLevel?: MfaLevelType;

  /**
   * This option is for internal use only in torus wallet and has no effect
   * on user's login on other dapps.
   *
   * Defaults to false
   * @defaultValue false
   * @internal
   */
  getWalletKey?: boolean;

  /**
   * extraLoginOptions can be used to pass standard oauth login options to
   * loginProvider.
   *
   * For ex: you will have to pass `login_hint` as user's email and `domain`
   * as your app domain in `extraLoginOptions` while using `email_passwordless`
   * loginProvider
   */
  extraLoginOptions?: ExtraLoginOptions;

  /**
   * Custom Logins can get a dapp share returned to them post successful login.
   * This is useful if the dapps want to use this share to allow users to login seamlessly
   * dappShare is a 24 word seed phrase
   */
  dappShare?: string;

  /**
   * This curve will be used to determine the public key encoded in the jwt token which returned in
   * `getUserInfo` function after user login.
   * You can use that public key from jwt token as a unique user identifier in your backend.
   *
   * - `'secp256k1'`: secp256k1 based pub key is added as a wallet public key in jwt token to use.
   * - `'ed25519'`: ed25519 based pub key is added as a wallet public key in jwt token to use.
   *
   * Note: This parameter won't change format of private key returned by auth. Private key returned
   * by auth is always `secp256k1`.
   *
   *
   * @defaultValue secp256k1
   */
  curve?: SUPPORTED_KEY_CURVES_TYPE;

  /**
   * Allows the dapp to set a custom redirect url for the manage mfa flow.
   *
   */
  dappUrl?: string;
};

export type SocialMfaModParams = {
  /**
   * authConnection sets the auth connection to be used.
   * You can use any of the valid authConnection from the supported list.
   */
  authConnection: AUTH_CONNECTION_TYPE | CUSTOM_AUTH_CONNECTION_TYPE;

  /**
   * extraLoginOptions can be used to pass standard oauth login options to
   * loginProvider.
   *
   * For ex: you will have to pass `login_hint` as user's email and `domain`
   * as your app domain in `extraLoginOptions` while using `email_passwordless`
   * loginProvider
   */
  extraLoginOptions?: ExtraLoginOptions;
};

export const LANGUAGES = {
  en: "en",
  ja: "ja",
  ko: "ko",
  de: "de",
  zh: "zh",
  es: "es",
  fr: "fr",
  pt: "pt",
  nl: "nl",
  tr: "tr",
  am: "am",
} as const;

export type LANGUAGE_TYPE = (typeof LANGUAGES)[keyof typeof LANGUAGES];

export const LANGUAGE_MAP: Record<LANGUAGE_TYPE, string> = {
  en: "english",
  ja: "japanese",
  ko: "korean",
  de: "german",
  zh: "mandarin",
  es: "spanish",
  fr: "french",
  pt: "portuguese",
  nl: "dutch",
  tr: "turkish",
  am: "amharic",
};

export const THEME_MODES = {
  light: "light",
  dark: "dark",
  auto: "auto",
} as const;

export type THEME_MODE_TYPE = (typeof THEME_MODES)[keyof typeof THEME_MODES];

export type WHITE_LABEL_THEME = {
  /**
   * `primary` color that represents your brand
   * Will be applied to elements such as primary button, nav tab(selected), loader, input focus, etc.
   */
  primary?: string;
  /**
   * `onPrimary` color that is meant to contrast with the primary color
   * Applies to elements such as the text in a primary button or nav tab(selected), blocks of text on top of a primary background, etc.
   */
  onPrimary?: string;
};

export type WhiteLabelData = {
  /**
   * App name to display in the UI
   */
  appName?: string;
  /**
   * App url
   */
  appUrl?: string;
  /**
   * App logo to use in light mode
   */
  logoLight?: string;
  /**
   * App logo to use in dark mode
   */
  logoDark?: string;
  /**
   * language which will be used by web3auth. app will use browser language if not specified. if language is not supported it will use "en"
   * en: english
   * de: german
   * ja: japanese
   * ko: korean
   * zh: mandarin
   * es: spanish
   * fr: french
   * pt: portuguese
   * nl: dutch
   * tr: turkish
   * am: Amharic
   *
   * @defaultValue en
   */
  defaultLanguage?: LANGUAGE_TYPE;
  /**
   theme
   *
   * @defaultValue light
   */
  mode?: THEME_MODE_TYPE;
  /**
   * Use logo loader
   *
   * @defaultValue false
   */
  useLogoLoader?: boolean;
  /**
   * Used to customize your theme
   */
  theme?: WHITE_LABEL_THEME;
  /**
   * Language specific link for terms and conditions on torus-website. See (examples/vue-app) to configure
   * e.g.
   * tncLink: http://example.com/tnc
   */
  tncLink?: string;
  /**
   * Language specific link for privacy policy on torus-website. See (examples/vue-app) to configure
   * e.g.
   * privacyPolicy: http://example.com/privacy
   */
  privacyPolicy?: string;
};

export type AuthConnectionConfigItem = {
  /**
   * The unique id for the auth connection.
   * If groupedAuthConnectionId is provided, authConnectionId will become a sub identifier for the groupedAuthConnectionId.
   */
  authConnectionId: string;
  /**
   * The type of login. Refer to enum `AUTH_CONNECTION_TYPE`
   */
  authConnection: AUTH_CONNECTION_TYPE;
  /**
   * Custom client_id. If not provided, we use the default for auth app
   */
  clientId?: string;
  /**
   * The grouped auth connection id.
   * If provided, authConnectionId will become a sub identifier for the groupedAuthConnectionId.
   */
  groupedAuthConnectionId?: string;
  /**
   * Custom jwt parameters to configure the login. Useful for Auth0 configuration or custom oAuth configuration.
   */
  jwtParameters?: Auth0ClientOptions;
  /**
   * Wallet AuthConnectionId. If not provided, we use the authConnectionId as the walletAuthConnectionId.
   * Used for internal purposes only.
   *
   * @internal
   */
  walletAuthConnectionId?: string;
  /**
   * The display name of the login provider.
   */
  name?: string;
};

export type AuthConnectionConfig = AuthConnectionConfigItem[];

export type AuthUserInfo = {
  email?: string;
  name?: string;
  profileImage?: string;
  groupedAuthConnectionId?: string;
  authConnectionId: string;
  userId: string;
  authConnection: AUTH_CONNECTION_TYPE | CUSTOM_AUTH_CONNECTION_TYPE;
  dappShare?: string;
  /**
   * Token issued by Web3Auth.
   */
  idToken?: string;

  /**
   * Token issued by OAuth provider. Will be available only if you are using
   * custom auth connection.
   */
  oAuthIdToken?: string;

  /**
   * Access Token issued by OAuth provider. Will be available only if you are using
   * custom auth connection.
   */
  oAuthAccessToken?: string;
  appState?: string;
  touchIDPreference?: string;
  isMfaEnabled?: boolean;
};

export type KeyMode = "v1" | "1/1" | "2/n";

export interface AuthSessionData {
  privKey?: string;
  coreKitKey?: string;
  ed25519PrivKey?: string;
  coreKitEd25519PrivKey?: string;
  sessionId?: string;
  oAuthPrivateKey?: string;
  tKey?: string;
  walletKey?: string;
  userInfo?: AuthUserInfo;
  keyMode?: KeyMode;
  metadataNonce?: string;
  authToken?: string;
  signatures?: string[];
  useCoreKitKey?: boolean;
}

export const MFA_FACTOR = {
  DEVICE: "deviceShareFactor",
  BACKUP_SHARE: "backUpShareFactor",
  SOCIAL_BACKUP: "socialBackupFactor",
  PASSWORD: "passwordFactor",
  PASSKEYS: "passkeysFactor",
  AUTHENTICATOR: "authenticatorFactor",
} as const;

export type MFA_FACTOR_TYPE = (typeof MFA_FACTOR)[keyof typeof MFA_FACTOR];
export type MFA_SETTINGS = {
  enable: boolean;
  priority?: number;
  mandatory?: boolean;
};

export type MfaSettings = Partial<Record<MFA_FACTOR_TYPE, MFA_SETTINGS>>;

export type AuthOptions = {
  /**
   * You can get your clientId/projectId by registering your
   * dapp on {@link "https://dashboard.web3auth.io"| developer dashboard}
   */
  clientId: string;

  /**
   * network specifies the web3auth network to be used.
   */
  network: WEB3AUTH_NETWORK_TYPE;

  /**
   * This parameter will be used to change the build environment of auth sdk.
   * @defaultValue production
   */
  buildEnv?: BUILD_ENV_TYPE;

  /**
   * redirectUrl is the dapp's url where user will be redirected after login.
   *
   * @remarks
   * Register this url at {@link "https://dashboard.web3auth.io"| developer dashboard}
   * else initialization will give error.
   */
  redirectUrl?: string;

  /**
   * two uxModes are supported:-
   * - `'POPUP'`: In this uxMode, a popup will be shown to user for login.
   * - `'REDIRECT'`: In this uxMode, user will be redirected to a new window tab for login.
   *
   * @defaultValue `'POPUP'`
   * @remarks
   *
   * Use of `'REDIRECT'` mode is recommended in browsers where popups might get blocked.
   */
  uxMode?: UX_MODE_TYPE;

  /**
   * replaceUrlOnRedirect removes the params from the redirected url after login
   *
   * @defaultValue true
   */
  replaceUrlOnRedirect?: boolean;

  /**
   * originData is used to verify the origin of dapp by iframe.
   *
   * @internal
   * @remarks
   * You don't have to pass originData explicitly if you have registered your dapp at
   * {@link "https://dashboard.web3auth.io"| developer dashboard}.
   *
   * originData contains a signature of dapp's origin url which is generated using
   * project's secret.
   */
  originData?: OriginData;

  /**
   * authConnectionConfig enables you to pass your own auth connection configuration for various
   * auth connections.
   *
   * authConnectionConfig is key value map where each key should be a valid auth connection and value
   * should be custom configuration for that auth connection
   *
   * @remarks
   * You can deploy your own auth connections from {@link "https://dashboard.web3auth.io"| developer dashboard}
   * to use here.
   *
   */
  authConnectionConfig?: AuthConnectionConfig;

  /**
   * sdkUrl is for internal development use only and is used to override the
   * `network` parameter.
   * @internal
   */
  sdkUrl?: string;

  /**
   * dashboardUrl is for internal development use only and is used to override the
   * `buildEnv` parameter.
   * @internal
   */
  dashboardUrl?: string;

  /**
   * options for whitelabling default auth modal.
   */
  whiteLabel?: WhiteLabelData;

  /**
   * Specify a custom citadel server url
   * @defaultValue https://api.web3auth.io/citadel-server
   * @internal
   */
  citadelServerUrl?: string;

  /**
   * Specify a custom storage server url
   * @defaultValue https://api.web3auth.io/session-service
   * @internal
   */
  storageServerUrl?: string;

  /**
   * Specify a custom session socket server url
   * @defaultValue https://session.web3auth.io
   * @internal
   */
  sessionSocketUrl?: string;

  /**
   * Custom storage adapters for tokens (sessionId, accessToken, refreshToken, idToken).
   * Each adapter must implement `IStorageAdapter` from `@toruslabs/session-manager`.
   * @defaultValue localStorage-based adapters
   */
  storage?: StorageConfig;

  /**
   * Custom provider for access tokens. When set, the session manager
   * uses this instead of its internal token refresh flow.
   */
  accessTokenProvider?: AccessTokenProvider;

  /**
   * Cookie configuration for token storage when using CookieStorage adapters.
   */
  cookieOptions?: CookieOptions;

  /**
   * sessionKey is the key to be used to override the default key used to store session data.
   *
   * @defaultValue auth_store
   */
  sessionKey?: string;

  /**
   * How long should a login session last at a minimum in seconds
   *
   * @defaultValue 30 * 86400 seconds
   * @remarks Max value of sessionTime can be 365 * 86400 (365 days)
   */
  sessionTime?: number;

  /**
   * This option is for internal use only in torus wallet and has no effect
   * on user's login on other dapps.
   * @internal
   */
  sessionNamespace?: string;

  /**
   * This parameter will be used to enable mfa factors and set priority on UI listing.
   * List of factors available
   * backUpShareFactor | socialFactor | passwordFactor | authenticatorFactor
   * @defaultValue false
   */
  mfaSettings?: MfaSettings;

  /**
   * This parameter will be used to select core kit key.
   * @defaultValue false
   */
  useCoreKitKey?: boolean;

  /**
   * This parameter will be used to select sdk mode.
   * @defaultValue default
   */
  sdkMode?: SDK_MODE_TYPE;

  /**
   * This parameter will be used to include user data in id token.
   * @defaultValue true
   */
  includeUserDataInToken?: boolean;
};

export interface BaseLoginParams {
  loginId?: string;
  sessionNamespace?: string;
  storageServerUrl?: string;
}

export interface AuthRequestPayload {
  actionType: AUTH_ACTIONS_TYPE;
  options: AuthOptions;
  params: Partial<LoginParams>;
  sessionId?: string;
}

export interface AuthTokenResponse {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  sessionNamespace?: string;
}

export interface AuthFlowError {
  error: string;
  state?: string;
}

export type AuthFlowResult = AuthTokenResponse | AuthFlowError;
