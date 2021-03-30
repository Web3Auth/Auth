import { OriginData } from "@toruslabs/openlogin-jrpc";
import { ExtraLoginOptions } from "@toruslabs/openlogin-utils";

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

export const OPENLOGIN_NETWORK = {
  MAINNET: "mainnet",
  TESTNET: "testnet",
  DEVELOPMENT: "development",
};

export type OPENLOGIN_NETWORK_TYPE = typeof OPENLOGIN_NETWORK[keyof typeof OPENLOGIN_NETWORK];

export type OpenLoginOptions = {
  clientId: string;
  network: OPENLOGIN_NETWORK_TYPE;
  iframeUrl?: string;
  redirectUrl?: string;
  loginUrl?: string;
  webAuthnUrl?: string;
  logoutUrl?: string;
  uxMode?: UX_MODE_TYPE;
  replaceUrlOnRedirect?: boolean;
  originData?: OriginData;
};

export type LoginParams = BaseRedirectParams & {
  loginProvider: string;
  fastLogin?: boolean;
  relogin?: boolean;
  skipTKey?: boolean;
  getWalletKey?: boolean;
  extraLoginOptions?: ExtraLoginOptions;
};
