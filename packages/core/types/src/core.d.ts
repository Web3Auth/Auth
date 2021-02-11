import { Provider } from "./provider";
declare class OpenLogin {
    provider: Provider;
    iframeURL: string;
    constructor({ iframeURL }: {
        iframeURL: string;
    });
    init(): Promise<void>;
}
export default OpenLogin;
