import { OriginData } from "@toruslabs/openlogin-jrpc";
import { ExtraLoginOptions } from "@toruslabs/openlogin-utils";
export declare const iframeDOMElementID = "openlogin-iframe";
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
    LOGIN: string;
    LOGOUT: string;
    CHECK_3PC_SUPPORT: string;
    SET_PID_DATA: string;
    GET_DATA: string;
};
export declare type OPENLOGIN_METHOD_TYPE = typeof OPENLOGIN_METHOD[keyof typeof OPENLOGIN_METHOD];
export declare const ALLOWED_INTERACTIONS: {
    POPUP: string;
    REDIRECT: string;
    JRPC: string;
};
export declare type ALLOWED_INTERACTIONS_TYPE = typeof ALLOWED_INTERACTIONS[keyof typeof ALLOWED_INTERACTIONS];
export declare type RequestParams = {
    url?: string;
    method: OPENLOGIN_METHOD_TYPE | string;
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
export declare type OpenLoginOptions = {
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
export declare type LoginParams = BaseRedirectParams & {
    loginProvider: string;
    fastLogin?: boolean;
    relogin?: boolean;
    skipTKey?: boolean;
    getWalletKey?: boolean;
    extraLoginOptions?: ExtraLoginOptions;
};
