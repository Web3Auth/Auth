import { LoginConfig, OriginData, WhiteLabelData } from "@toruslabs/openlogin-jrpc";
import { ExtraLoginOptions } from "@toruslabs/openlogin-utils";
export declare const iframeDOMElementID = "openlogin-iframe";
export declare const modalDOMElementID = "openlogin-modal";
export declare const storeKey = "openlogin_store";
export declare type PopupResponse<T> = {
    pid: string;
    data: T;
};
export declare type Maybe<T> = Partial<T> | null | undefined;
export declare const UX_MODE: {
    readonly POPUP: "popup";
    readonly REDIRECT: "redirect";
};
export declare type UX_MODE_TYPE = typeof UX_MODE[keyof typeof UX_MODE];
export declare const OPENLOGIN_METHOD: {
    readonly LOGIN: "openlogin_login";
    readonly LOGOUT: "openlogin_logout";
    readonly CHECK_3PC_SUPPORT: "openlogin_check_3PC_support";
    readonly SET_PID_DATA: "openlogin_set_pid_data";
    readonly GET_DATA: "openlogin_get_data";
};
export declare type CUSTOM_OPENLOGIN_METHOD_TYPE = string & {
    toString?: (radix?: number) => string;
};
export declare type OPENLOGIN_METHOD_TYPE = typeof OPENLOGIN_METHOD[keyof typeof OPENLOGIN_METHOD];
export declare const ALLOWED_INTERACTIONS: {
    readonly POPUP: "popup";
    readonly REDIRECT: "redirect";
    readonly JRPC: "jrpc";
};
export declare type ALLOWED_INTERACTIONS_TYPE = typeof ALLOWED_INTERACTIONS[keyof typeof ALLOWED_INTERACTIONS];
export declare type RequestParams = {
    startUrl?: string;
    popupUrl?: string;
    method: OPENLOGIN_METHOD_TYPE | CUSTOM_OPENLOGIN_METHOD_TYPE;
    params: Record<string, unknown>[];
    allowedInteractions: ALLOWED_INTERACTIONS_TYPE[];
};
export declare type BaseLogoutParams = {
    clientId: string;
    fastLogin: boolean;
};
export declare type BaseRedirectParams = {
    redirectUrl?: string;
    appState?: string;
};
export declare const OPENLOGIN_NETWORK: {
    readonly MAINNET: "mainnet";
    readonly TESTNET: "testnet";
    readonly DEVELOPMENT: "development";
};
export declare type OPENLOGIN_NETWORK_TYPE = typeof OPENLOGIN_NETWORK[keyof typeof OPENLOGIN_NETWORK];
export declare type OpenLoginOptions = {
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
export declare const LOGIN_PROVIDER: {
    readonly GOOGLE: "google";
    readonly FACEBOOK: "facebook";
    readonly REDDIT: "reddit";
    readonly DISCORD: "discord";
    readonly TWITCH: "twitch";
    readonly APPLE: "apple";
    readonly LINE: "line";
    readonly GITHUB: "github";
    readonly KAKAO: "kakao";
    readonly LINKEDIN: "linkedin";
    readonly TWITTER: "twitter";
    readonly WEIBO: "weibo";
    readonly WECHAT: "wechat";
    readonly EMAIL_PASSWORDLESS: "email_passwordless";
    readonly WEBAUTHN: "webauthn";
};
export declare type LOGIN_PROVIDER_TYPE = typeof LOGIN_PROVIDER[keyof typeof LOGIN_PROVIDER];
export declare type CUSTOM_LOGIN_PROVIDER_TYPE = string & {
    toString?: (radix?: number) => string;
};
export declare type LoginParams = BaseRedirectParams & {
    loginProvider: LOGIN_PROVIDER_TYPE | CUSTOM_LOGIN_PROVIDER_TYPE;
    fastLogin?: boolean;
    relogin?: boolean;
    skipTKey?: boolean;
    getWalletKey?: boolean;
    extraLoginOptions?: ExtraLoginOptions;
};
export declare type OpenloginUserInfo = {
    email: string;
    name: string;
    profileImage: string;
    aggregateVerifier: string;
    verifier: string;
    verifierId: string;
    typeOfLogin: LOGIN_PROVIDER_TYPE | CUSTOM_LOGIN_PROVIDER_TYPE;
};
