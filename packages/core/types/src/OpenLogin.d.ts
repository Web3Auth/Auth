import { JRPCRequest, JRPCResponse, OriginData } from "@toruslabs/openlogin-jrpc";
import { UX_MODE_TYPE } from "./constants";
import OpenLoginStore from "./OpenLoginStore";
import { Provider } from "./Provider";
export declare const ALLOWED_INTERACTIONS: {
    POPUP: string;
    REDIRECT: string;
    JRPC: string;
};
export declare type ALLOWED_INTERACTIONS_TYPE = typeof ALLOWED_INTERACTIONS[keyof typeof ALLOWED_INTERACTIONS];
export declare type RequestParams = {
    url?: string;
    method: string;
    params: Record<string, unknown>[];
    allowedInteractions: ALLOWED_INTERACTIONS_TYPE[];
};
export declare type BaseLogoutParams = {
    clientId: string;
    fastLogin: boolean;
};
export declare type OpenLoginState = {
    loginUrl: string;
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
    originData: OriginData;
};
export declare type BaseLoginParams = {
    redirectUrl?: string;
};
export declare type LoginParams = BaseLoginParams & {
    loginProvider: string;
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
declare class OpenLogin {
    provider: Provider;
    state: OpenLoginState;
    constructor(options: OpenLoginOptions);
    initState(options: Required<OpenLoginOptions>): void;
    init(): Promise<void>;
    get privKey(): string;
    fastLogin(params: Partial<BaseLoginParams>): Promise<{
        privKey: string;
    }>;
    login(params?: LoginParams & Partial<BaseLoginParams>): Promise<{
        privKey: string;
    }>;
    logout(logoutParams?: Partial<BaseLogoutParams>): Promise<void>;
    request<T>(args: RequestParams): Promise<T>;
    _jrpcRequest<T, U>(args: JRPCRequest<T>): Promise<U>;
    _check3PCSupport(): Promise<JRPCResponse<Record<string, boolean>>>;
    _setPIDData(pid: string, data: Record<string, unknown>[]): Promise<void>;
    _getData(): Promise<Record<string, unknown>>;
    _syncState(newState: Record<string, unknown>): void;
    _cleanup(): Promise<void>;
}
export default OpenLogin;
