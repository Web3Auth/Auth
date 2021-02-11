import { JRPCRequest, ObjectMultiplex } from "@openlogin/jrpc";
import { Provider } from "./provider";
import { Maybe } from "./utils";
declare type OpenLoginState = {
    iframeURL: string;
};
declare class OpenLogin {
    provider: Provider;
    state: OpenLoginState;
    rpcMux: ObjectMultiplex;
    constructor({ iframeURL }: {
        iframeURL: string;
    });
    init(): Promise<void>;
    cleanup(): Promise<void>;
    request<T, U>(args: JRPCRequest<T>): Promise<Maybe<U>>;
}
export default OpenLogin;
