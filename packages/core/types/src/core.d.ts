import { JRPCRequest, Json } from "@openlogin/jrpc";
import { Provider } from "./provider";
import OpenLoginStore from "./store";
import { Maybe } from "./utils";
declare type LoginParams = {
    clientId?: string;
    redirectUrl?: string;
    loginProvider: string;
    fastLogin?: boolean;
};
interface OpenLoginState {
    iframeUrl: string;
    userProfile?: Json;
    loginDefaults: Partial<LoginParams>;
    store: OpenLoginStore;
}
declare type OpenLoginOptions = {
    clientId: string;
    iframeUrl: string;
};
declare class OpenLogin {
    provider: Provider;
    state: OpenLoginState;
    constructor(options: OpenLoginOptions);
    initState(options: OpenLoginOptions): void;
    init(): Promise<void>;
    login({ options, popup }: {
        options: LoginParams;
        popup: boolean;
    }): Promise<void>;
    open(url: string, popup?: boolean): Promise<void>;
    request<T, U>(args: JRPCRequest<T>): Promise<Maybe<U>>;
    _syncState(newState: Record<string, unknown>): void;
    _getHashQueryParams(): Record<string, unknown>;
    _getIframeData(): Promise<Record<string, unknown>>;
    _cleanup(): Promise<void>;
}
export default OpenLogin;
