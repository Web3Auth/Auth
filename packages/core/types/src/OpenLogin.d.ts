import { JRPCRequest } from "@openlogin/jrpc";
import { UX_MODE_TYPE } from "./constants";
import OpenLoginStore from "./OpenLoginStore";
import { Provider } from "./Provider";
import { Maybe } from "./utils";
declare type BaseLogoutParams = {
    clientId: string;
    uxMode: UX_MODE_TYPE;
};
declare type OpenLoginState = {
    authUrl: string;
    privKey?: string;
    support3PC?: boolean;
    clientId: string;
    iframeUrl: string;
    redirectUrl: string;
    webAuthnUrl: string;
    logoutUrl: string;
    store: OpenLoginStore;
    uxMode: UX_MODE_TYPE;
    replaceUrlOnRedirect: boolean;
};
declare type BaseLoginParams = {
    clientId: string;
    uxMode: UX_MODE_TYPE;
    redirectUrl?: string;
};
declare type LoginParams = BaseLoginParams & {
    loginProvider: string;
};
declare type OpenLoginOptions = {
    clientId: string;
    iframeUrl: string;
    redirectUrl?: string;
    authUrl?: string;
    webAuthnUrl?: string;
    logoutUrl?: string;
    uxMode?: UX_MODE_TYPE;
    replaceUrlOnRedirect?: boolean;
};
declare class OpenLogin {
    provider: Provider;
    state: OpenLoginState;
    constructor(options: OpenLoginOptions);
    initState(options: Required<OpenLoginOptions>): void;
    init(): Promise<void>;
    fastLogin(params?: Partial<BaseLoginParams>): Promise<{
        userKey?: string;
    }>;
    login(params?: LoginParams & Partial<BaseLoginParams>): Promise<string>;
    logout(params?: Partial<BaseLogoutParams>): Promise<void>;
    open<T>(url: string, uxMode: UX_MODE_TYPE): Promise<T>;
    request<T, U>(args: JRPCRequest<T>): Promise<Maybe<U>>;
    _requestLogout(): Promise<void>;
    _check3PCSupport(): Promise<Record<string, unknown>>;
    _setParams(loginParams: Omit<Partial<LoginParams>, "uxMode">): Promise<void>;
    _getIframeData(): Promise<Record<string, unknown>>;
    _syncState(newState: Record<string, unknown>): void;
    _cleanup(): Promise<void>;
}
export default OpenLogin;
