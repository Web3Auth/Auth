import { LoginConfig, OriginData, WhiteLabelData } from "@toruslabs/openlogin-jrpc";
import { ExtraLoginOptions } from "@toruslabs/openlogin-utils";

export const iframeDOMElementID = "openlogin-iframe";
export const modalDOMElementID = "openlogin-modal";

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
} as const;

// autocomplete workaround https://github.com/microsoft/TypeScript/issues/29729
export type CUSTOM_OPENLOGIN_METHOD_TYPE = string & { toString?: (radix?: number) => string };

export type OPENLOGIN_METHOD_TYPE = typeof OPENLOGIN_METHOD[keyof typeof OPENLOGIN_METHOD];

export const ALLOWED_INTERACTIONS = {
  POPUP: "popup",
  REDIRECT: "redirect",
  JRPC: "jrpc",
} as const;

export type ALLOWED_INTERACTIONS_TYPE = typeof ALLOWED_INTERACTIONS[keyof typeof ALLOWED_INTERACTIONS];

export type RequestParams = {
  startUrl?: string;
  popupUrl?: string;
  method: OPENLOGIN_METHOD_TYPE | CUSTOM_OPENLOGIN_METHOD_TYPE;
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

export const OPENLOGIN_NETWORK = {
  MAINNET: "mainnet",
  TESTNET: "testnet",
  DEVELOPMENT: "development",
} as const;

export type OPENLOGIN_NETWORK_TYPE = typeof OPENLOGIN_NETWORK[keyof typeof OPENLOGIN_NETWORK];

export type OpenLoginOptions = {
  clientId: string;
  network: OPENLOGIN_NETWORK_TYPE;
  no3PC?: boolean;
  redirectUrl?: string;
  uxMode?: UX_MODE_TYPE;
  replaceUrlOnRedirect?: boolean;
  originData?: OriginData;
  loginConfig?: LoginConfig;
  _iframeUrl?: string;
  _startUrl?: string;
  _popupUrl?: string;
  whiteLabel?: WhiteLabelData;
};

export const LOGIN_PROVIDER = {
  GOOGLE: "google",
  FACEBOOK: "facebook",
  REDDIT: "reddit",
  DISCORD: "discord",
  TWITCH: "twitch",
  APPLE: "apple",
  LINE: "line",
  GITHUB: "github",
  KAKAO: "kakao",
  LINKEDIN: "linkedin",
  TWITTER: "twitter",
  WEIBO: "weibo",
  WECHAT: "wechat",
  EMAIL_PASSWORDLESS: "email_passwordless",
  WEBAUTHN: "webauthn",
} as const;

export type LOGIN_PROVIDER_TYPE = typeof LOGIN_PROVIDER[keyof typeof LOGIN_PROVIDER];

// autocomplete workaround https://github.com/microsoft/TypeScript/issues/29729
export type CUSTOM_LOGIN_PROVIDER_TYPE = string & { toString?: (radix?: number) => string };

export type LoginParams = BaseRedirectParams & {
   /**
     * loginProvider sets the oauth login method to be used.
     * You can use any of the valid loginProvider from this list.
     * 
     * If this param is not passed then it will show all the available
     * login methods to user in a modal.
     * 
     */
    loginProvider: LOGIN_PROVIDER_TYPE | CUSTOM_LOGIN_PROVIDER_TYPE;

    /**
     * Setting fastLogin to `true` will force user to login with webauthn if
     * webauthn is available on device. 
     * 
     * Defaults to false
     * @default false
     *
     * @remarks
     * Use this option with caution only when you are sure about that user has enabled
     * webauthn while registeration, else don't use this option. Openlogin will itself
     * take care of detecting and handling webauthn. In general you may not need to use 
     * this option.
     */
    fastLogin?: boolean;

    /**
     * Setting relogin to `true` will force user to relogin when login 
     * method is called even if user is already logged in. By default login
     * method call skips login process if user is already logged in. 
     * 
     * * Defaults to false
     * @default false
     */
    relogin?: boolean;

    /**
     * Skips TKey onboarding for new users, whereas old users will be 
     * presented with an option to skip tKey in UI if this option is enabled.
     * 
     * Defaults to false
     * @default false
     */
    skipTKey?: boolean;
    getWalletKey?: boolean;
    extraLoginOptions?: ExtraLoginOptions;
};

export type OpenloginUserInfo = {
  email: string;
  name: string;
  profileImage: string;
  aggregateVerifier: string;
  verifier: string;
  verifierId: string;
  typeOfLogin: LOGIN_PROVIDER_TYPE | CUSTOM_LOGIN_PROVIDER_TYPE;
};
