import { OriginData } from "@toruslabs/openlogin-jrpc";

export const iframeDOMElementID = "openlogin-iframe";
export const storeKey = "openlogin_store";

export type PopupResponse<T> = {
  pid: string;
  data: T;
};

export type Maybe<T> = Partial<T> | null | undefined;

export const UX_MODE = {
  POPUP: "popup",
  REDIRECT: "redirect",
} as const;

export type UX_MODE_TYPE = typeof UX_MODE[keyof typeof UX_MODE];

export const OPENLOGIN_METHOD = {
  LOGIN: "openlogin_login",
  LOGOUT: "openlogin_logout",
  CHECK_3PC_SUPPORT: "openlogin_check_3PC_support",
  SET_PID_DATA: "openlogin_set_pid_data",
  GET_DATA: "openlogin_get_data",
};

export type OPENLOGIN_METHOD_TYPE = typeof OPENLOGIN_METHOD[keyof typeof OPENLOGIN_METHOD];

export const ALLOWED_INTERACTIONS = {
  POPUP: "popup",
  REDIRECT: "redirect",
  JRPC: "jrpc",
};

export type ALLOWED_INTERACTIONS_TYPE = typeof ALLOWED_INTERACTIONS[keyof typeof ALLOWED_INTERACTIONS];

export type RequestParams = {
  url?: string;
  method: OPENLOGIN_METHOD_TYPE | string;
  params: Record<string, unknown>[];
  allowedInteractions: ALLOWED_INTERACTIONS_TYPE[];
};

export type BaseLogoutParams = {
  clientId: string;
  fastLogin: boolean;
};

export type BaseRedirectParams = {
  redirectUrl?: string;
  appState?: string;
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
  originData?: OriginData;
};

// TODO: not all of the options are implemented
export type ExtraLoginOptions = {
  /**
   * - `'page'`: displays the UI with a full page view
   * - `'popup'`: displays the UI with a popup window
   * - `'touch'`: displays the UI in a way that leverages a touch interface
   * - `'wap'`: displays the UI with a "feature phone" type interface
   */
  display?: "page" | "popup" | "touch" | "wap" | string;
  /**
   * - `'none'`: do not prompt user for login or consent on reauthentication
   * - `'login'`: prompt user for reauthentication
   * - `'consent'`: prompt user for consent before processing request
   * - `'select_account'`: prompt user to select an account
   */
  prompt?: "none" | "login" | "consent" | "select_account" | string;
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

  /**
   * If you need to send custom parameters to the Authorization Server,
   * make sure to use the original parameter name.
   */
  [key: string]: unknown;
};

export type LoginParams = BaseRedirectParams & {
  loginProvider: string;
  fastLogin?: boolean;
  relogin?: boolean;
  skipTKey?: boolean;
  getWalletKey?: boolean;
  extraLoginOptions?: ExtraLoginOptions;
};
