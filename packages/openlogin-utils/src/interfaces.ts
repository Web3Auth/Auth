import { LOGIN_PROVIDER, MFA_LEVELS, OPENLOGIN_NETWORK, SUPPORTED_KEY_CURVES, UX_MODE } from "./constants";

export type UX_MODE_TYPE = (typeof UX_MODE)[keyof typeof UX_MODE];

export type OriginData = {
  [P in string]: string;
};

export type UserData = {
  [P in string]: string;
};

export type BaseRedirectParams = {
  /**
   * redirectUrl is the dapp's url where user will be redirected after login.
   *
   * @remarks
   * Register this url at {@link "https://dashboard.web3auth.io"| developer dashboard}
   * else initialization will give error.
   */
  redirectUrl?: string;
  /**
   * Any custom state you wish to pass along. This will be returned to you post redirect.
   * Use this to store data that you want to be available to the dapp after login.
   */
  appState?: string;
};

/**
 * {@label loginProviderType}
 */
export type LOGIN_PROVIDER_TYPE = (typeof LOGIN_PROVIDER)[keyof typeof LOGIN_PROVIDER];

// autocomplete workaround https://github.com/microsoft/TypeScript/issues/29729
export type CUSTOM_LOGIN_PROVIDER_TYPE = string & { toString?: (radix?: number) => string };

export type MfaLevelType = (typeof MFA_LEVELS)[keyof typeof MFA_LEVELS];

export type SUPPORTED_KEY_CURVES_TYPE = (typeof SUPPORTED_KEY_CURVES)[keyof typeof SUPPORTED_KEY_CURVES];

export type OPENLOGIN_NETWORK_TYPE = (typeof OPENLOGIN_NETWORK)[keyof typeof OPENLOGIN_NETWORK];

export interface BaseLoginOptions {
  /**
   * If you need to send custom parameters to the Authorization Server,
   * make sure to use the original parameter name.
   */
  [key: string]: unknown;
  /**
   * - `'page'`: displays the UI with a full page view
   * - `'popup'`: displays the UI with a popup window
   * - `'touch'`: displays the UI in a way that leverages a touch interface
   * - `'wap'`: displays the UI with a "feature phone" type interface
   */
  display?: "page" | "popup" | "touch" | "wap" | string;
  /**
   * - `'none'`: do not prompt user for login or consent on re-authentication
   * - `'login'`: prompt user for re-authentication
   * - `'consent'`: prompt user for consent before processing request
   * - `'select_account'`: prompt user to select an account
   */
  prompt?: "none" | "login" | "consent" | "select_account" | string;
  /**
   * Maximum allowable elapsed time (in seconds) since authentication.
   * If the last time the user authenticated is greater than this value,
   * the user must be re-authenticated.
   */
  max_age?: string | number;
  /**
   * The space-separated list of language tags, ordered by preference.
   * For example: `'fr-CA fr en'`.
   */
  ui_locales?: string;
  /**
   * Previously issued ID Token.
   */
  id_token_hint?: string;
  /**
   * The user's email address or other identifier. When your app knows
   * which user is trying to authenticate, you can provide this parameter
   * to pre-fill the email box or select the right session for sign-in.
   *
   * This currently only affects the classic Lock experience.
   */
  login_hint?: string;
  acr_values?: string;
  /**
   * The default scope to be used on authentication requests.
   * The defaultScope defined in the Auth0Client is included
   * along with this scope
   */
  scope?: string;
  /**
   * The default audience to be used for requesting API access.
   */
  audience?: string;
  /**
   * The name of the connection configured for your application.
   * If null, it will redirect to the Auth0 Login Page and show
   * the Login Widget.
   */
  connection?: string;
}

export interface ExtraLoginOptions extends BaseLoginOptions {
  /**
   * Your Auth0 account domain such as `'example.auth0.com'`,
   * `'example.eu.auth0.com'` or , `'example.mycompany.com'`
   * (when using [custom domains](https://auth0.com/docs/custom-domains))
   */
  domain?: string;
  /**
   * The Client ID found on your Application settings page
   */
  client_id?: string;
  /**
   * The default URL where Auth0 will redirect your browser to with
   * the authentication result. It must be whitelisted in
   * the "Allowed Callback URLs" field in your Auth0 Application's
   * settings. If not provided here, it should be provided in the other
   * methods that provide authentication.
   */
  redirect_uri?: string;
  /**
   * The value in seconds used to account for clock skew in JWT expirations.
   * Typically, this value is no more than a minute or two at maximum.
   * Defaults to 60s.
   */
  leeway?: number;
  /**
   * The field in jwt token which maps to verifier id
   */
  verifierIdField?: string;
  /**
   * Whether the verifier id field is case sensitive
   * @defaultValue true
   */
  isVerifierIdCaseSensitive?: boolean;
}

export type LoginParams = BaseRedirectParams & {
  /**
   * loginProvider sets the oauth login method to be used.
   * You can use any of the valid loginProvider from the supported list.
   */
  loginProvider: LOGIN_PROVIDER_TYPE | CUSTOM_LOGIN_PROVIDER_TYPE;

  /**
   * You can set the `mfaLevel` to customize when mfa screen should be shown to user.
   * It currently accepts 4 values:-
   * - `'default'`: Setting mfa level to `default` will present mfa screen to user on every third login.
   * - `'optional'`: Setting mfa level to `default` will present mfa screen to user on every login but user can skip it.
   * - `'mandatory'`: Setting mfa level to `mandatory` will make it mandatory for user to setup mfa after login.
   * - `'none'`: Setting mfa level to `none` will make the user skip the mfa setup screen
   *
   * Defaults to `default`
   * @defaultValue `default`
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
   * Note: This parameter won't change format of private key returned by openlogin. Private key returned
   * by openlogin is always `secp256k1`. As of now you have to convert it to `'ed25519'` if you want.
   * You can use `@toruslabs/openlogin-ed25519` npm package for this purpose.
   *
   *
   * @defaultValue secp256k1
   */
  curve?: SUPPORTED_KEY_CURVES_TYPE;

  /**
   * This field is used by native apps.
   * For web applications, use redirectUrl instead.
   * @internal
   */
  mobileOrigin?: string;
};

export interface ColorPalette {
  50?: string;
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500?: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
}

export type WhiteLabelData = {
  /**
   * App name to display in the UI
   */
  name?: string;
  /**
   * App url
   */
  url?: string;
  /**
   * App logo to use in light mode
   */
  logoLight?: string;
  /**
   * App logo to use in dark mode
   */
  logoDark?: string;
  /**
   * Default language to use
   *
   * @defaultValue en
   */
  defaultLanguage?: string;
  /**
   * Whether to enable dark mode
   *
   * @defaultValue false
   */
  dark?: boolean;
  /**
   * Use logo loader
   *
   * @defaultValue false
   */
  useLogoLoader?: boolean;

  /**
   * Used to customize theme of the login modal with following options
   * `'primary'` - To customize primary color of modal's content.
   */
  theme?: {
    primary?: string | ColorPalette;
    gray?: string | ColorPalette;
    red?: string | ColorPalette;
    green?: string | ColorPalette;
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
    white?: string;
  };
};

export type TypeOfLogin =
  | "google"
  | "facebook"
  | "reddit"
  | "discord"
  | "twitch"
  | "apple"
  | "github"
  | "linkedin"
  | "twitter"
  | "weibo"
  | "line"
  | "email_password"
  | "passwordless"
  | "jwt"
  | "webauthn";

export interface JwtParameters extends BaseLoginOptions {
  /**
   * Your Auth0 account domain such as `'example.auth0.com'`,
   * `'example.eu.auth0.com'` or , `'example.mycompany.com'`
   * (when using [custom domains](https://auth0.com/docs/custom-domains))
   */
  domain?: string;
  /**
   * The Client ID found on your Application settings page
   */
  client_id?: string;
  /**
   * The default URL where Auth0 will redirect your browser to with
   * the authentication result. It must be whitelisted in
   * the "Allowed Callback URLs" field in your Auth0 Application's
   * settings. If not provided here, it should be provided in the other
   * methods that provide authentication.
   */
  redirect_uri?: string;
  /**
   * The value in seconds used to account for clock skew in JWT expirations.
   * Typically, this value is no more than a minute or two at maximum.
   * Defaults to 60s.
   */
  leeway?: number;

  /**
   * The field in jwt token which maps to verifier id
   */
  verifierIdField?: string;

  /**
   * Whether the verifier id field is case sensitive
   * @defaultValue true
   */
  isVerifierIdCaseSensitive?: boolean;
}

export type LoginConfig = Record<
  string,
  {
    verifier: string;

    /**
     * The type of login. Refer to enum `LOGIN_TYPE`
     */
    typeOfLogin: TypeOfLogin;

    /**
     * Display Name. If not provided, we use the default for openlogin app
     */
    name?: string;

    /**
     * Description for button. If provided, it renders as a full length button. else, icon button
     */
    description?: string;

    /**
     * Custom client_id. If not provided, we use the default for openlogin app
     */
    clientId?: string;

    verifierSubIdentifier?: string;

    /**
     * Logo to be shown on mouse hover. If not provided, we use the default for openlogin app
     */
    logoHover?: string;

    /**
     * Logo to be shown on dark background (dark theme). If not provided, we use the default for openlogin app
     */
    logoLight?: string;

    /**
     * Logo to be shown on light background (light theme). If not provided, we use the default for openlogin app
     */
    logoDark?: string;

    /**
     * Show login button on the main list
     */
    mainOption?: boolean;

    /**
     * Whether to show the login button on modal or not
     */
    showOnModal?: boolean;

    /**
     * Whether to show the login button on desktop
     */
    showOnDesktop?: boolean;

    /**
     * Whether to show the login button on mobile
     */
    showOnMobile?: boolean;

    /**
     * If we are using social logins as a backup factor,
     * then this option will be used to show the type of social login
     * on the social backup login screen.
     */
    showOnSocialBackupFactor?: boolean;

    /**
     * Custom jwt parameters to configure the login. Useful for Auth0 configuration
     */
    jwtParameters?: JwtParameters;
  }
>;

export type OpenloginUserInfo = {
  email?: string;
  name?: string;
  profileImage?: string;
  aggregateVerifier?: string;
  verifier: string;
  verifierId: string;
  typeOfLogin: LOGIN_PROVIDER_TYPE | CUSTOM_LOGIN_PROVIDER_TYPE;
  dappShare?: string;
  /**
   * Token issued by Web3Auth.
   */
  idToken?: string;

  /**
   * Token issued by OAuth provider. Will be available only if you are using
   * custom verifiers.
   */
  oAuthIdToken?: string;

  /**
   * Access Token issued by OAuth provider. Will be available only if you are using
   * custom verifiers.
   */
  oAuthAccessToken?: string;
  appState?: string;
  touchIDPreference?: string;
};

export interface OpenloginSessionData {
  privKey?: string;
  coreKitKey?: string;
  ed25519PrivKey?: string;
  coreKitEd25519PrivKey?: string;
  sessionId?: string;
  oAuthPrivateKey?: string;
  tKey?: string;
  walletKey?: string;
  userInfo?: OpenloginUserInfo;
  /**
   * Legacy reasons
   * Will remove this in future releases.
   */
  store?: OpenloginUserInfo;
}

export const MFA_FACTOR = {
  DEVICE: "deviceShareFactor",
  BACKUP_SHARE: "backUpShareFactor",
  SOCIAL_BACKUP: "socialBackupFactor",
  PASSWORD: "passwordFactor",
} as const;

export type MFA_FACTOR_TYPE = (typeof MFA_FACTOR)[keyof typeof MFA_FACTOR];
export type MFA_SETTINGS = {
  enable: boolean;
  priority?: number;
  mandatory?: boolean;
};

export type MfaSettings = Partial<Record<MFA_FACTOR_TYPE, MFA_SETTINGS>>;

export type OpenLoginOptions = {
  /**
   * You can get your clientId/projectId by registering your
   * dapp on {@link "https://dashboard.web3auth.io"| developer dashboard}
   */
  clientId: string;

  /**
   * network specifies the openlogin sdk url to be used.
   *
   * - `'mainnet'`: https://app.openlogin.com will be used which is the production version.
   * - `'cyan'`: https://cyan.openlogin.com will be used which is the production cyan version.
   * - `'testnet'`: https://testing.openlogin.com will be used which is the testing version.
   * - `'development'`: http://localhost:3000 will be used for development purpose.
   */
  network: OPENLOGIN_NETWORK_TYPE;

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
   * loginConfig enables you to pass your own login verifiers configuration for various
   * loginProviders.
   *
   * loginConfig is key value map where each key should be a valid loginProvider and value
   * should be custom configuration for that loginProvider
   *
   * @remarks
   * You can deploy your own verifiers from {@link "https://dashboard.web3auth.io"| developer dashboard}
   * to use here.
   *
   */
  loginConfig?: LoginConfig;

  /**
   * webauthnTransport enables you to configure the transport type user can use
   * for saving their share.
   *
   * @defaultValue ["internal"]
   *
   * @remarks
   * This is only available for v1 users.
   */
  webauthnTransports?: AuthenticatorTransport[];

  /**
   * sdkUrl is for internal development use only and is used to override the
   * `network` parameter.
   * @internal
   */
  sdkUrl?: string;

  /**
   * options for whitelabling default openlogin modal.
   */
  whiteLabel?: WhiteLabelData;

  /**
   * Specify a custom storage server url
   * @defaultValue https://broadcast-server.tor.us
   * @internal
   */
  storageServerUrl?: string;

  /**
   * setting to "local" will persist social login session accross browser tabs.
   *
   * @defaultValue "local"
   */
  storageKey?: "session" | "local";

  /**
   * How long should a login session last at a minimum in seconds
   *
   * @defaultValue 86400 seconds
   * @remarks Max value of sessionTime can be 7 * 86400 (7 days)
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
   * backUpShareFactor | socialFactor | passwordFactor
   * @defaultValue false
   */
  mfaSettings?: MfaSettings;
};

export interface BaseLoginParams {
  loginId?: string;
  sessionNamespace?: string;
}

export interface OpenloginSessionConfig {
  options: OpenLoginOptions;
  params: LoginParams;
}
