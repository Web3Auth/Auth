export type OriginData = {
  [P in string]: string;
};

export type UserData = {
  [P in string]: string;
};

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
   * Used to customize theme of the login modal with following options
   * `'primary'` - To customize primary color of modal's content.
   */
  theme?: {
    [P in string]: string;
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
  display?: "page" | "popup" | "touch" | "wap";
  /**
   * - `'none'`: do not prompt user for login or consent on reauthentication
   * - `'login'`: prompt user for reauthentication
   * - `'consent'`: prompt user for consent before processing request
   * - `'select_account'`: prompt user to select an account
   */
  prompt?: "none" | "login" | "consent" | "select_account";
  /**
   * Maximum allowable elasped time (in seconds) since authentication.
   * If the last time the user authenticated is greater than this value,
   * the user must be reauthenticated.
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

export interface JwtParameters extends BaseLoginOptions {
  /**
   * Your Auth0 account domain such as `'example.auth0.com'`,
   * `'example.eu.auth0.com'` or , `'example.mycompany.com'`
   * (when using [custom domains](https://auth0.com/docs/custom-domains))
   */
  domain: string;
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
    name: string;

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

export type MfaSettings = Record<
  string,
  {
    enable: boolean;
    priority?: number;
  }
>;

export type SessionInfo = {
  _pid: string;
  _user: string;
  _userSig: string;
  _userData: UserData;
  _origin: string;
  _originData: OriginData;
  _clientId: string;
  _whiteLabelData?: WhiteLabelData;
  _loginConfig: LoginConfig;
  _mfaSettings: MfaSettings;
  _sessionId?: string;
};
