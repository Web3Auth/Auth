import { JRPCRequest, OriginData } from "@toruslabs/openlogin-jrpc";
import { BaseLogoutParams, BaseRedirectParams, LoginParams, OpenLoginOptions, RequestParams, UX_MODE_TYPE } from "./constants";
import { Modal } from "./Modal";
import OpenLoginStore from "./OpenLoginStore";
import Provider from "./Provider";
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
declare class OpenLogin {
    provider: Provider;
    state: OpenLoginState;
    modal: Modal;
    constructor(options: OpenLoginOptions);
    initState(options: Required<OpenLoginOptions>): void;
    init(): Promise<void>;
    get privKey(): string;
    fastLogin(params: Partial<BaseRedirectParams>): Promise<{
        privKey: string;
    }>;
    login(params?: LoginParams & Partial<BaseRedirectParams>): Promise<{
        privKey: string;
    }>;
    _selectedLogin(params: LoginParams & Partial<BaseRedirectParams>): Promise<{
        privKey: string;
    }>;
    logout(logoutParams?: Partial<BaseLogoutParams> & Partial<BaseRedirectParams>): Promise<void>;
    request<T>(args: RequestParams): Promise<T>;
    _jrpcRequest<T, U>(args: JRPCRequest<T>): Promise<U>;
    _check3PCSupport(): Promise<Record<string, boolean>>;
    _setPIDData(pid: string, data: Record<string, unknown>[]): Promise<void>;
    _getData(): Promise<Record<string, unknown>>;
    _syncState(newState: Record<string, unknown>): void;
    _modal(): Promise<{
        privKey: string;
    }>;
    _cleanup(): Promise<void>;
}
export default OpenLogin;
