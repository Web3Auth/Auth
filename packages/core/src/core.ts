import { Provider } from "./provider";

class OpenLogin {
  provider: Provider;

  iframeURL: string;

  constructor({ iframeURL }: { iframeURL: string }) {
    this.provider = new Provider();
    this.iframeURL = iframeURL;
  }

  async init(): Promise<void> {
    await this.provider.init({ iframeURL: this.iframeURL });
  }
}

export default OpenLogin;
