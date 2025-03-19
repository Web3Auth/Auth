import log from "loglevel";

import { IFRAME_MODAL_ID, JRPC_METHODS } from "../utils/constants";
import { AuthSessionConfig, WEB3AUTH_NETWORK_TYPE } from "../utils/interfaces";
import { htmlToElement } from "../utils/utils";

export const preloadIframe = (url: string) => {
  try {
    if (typeof document === "undefined") return;
    const authIframeHtml = document.createElement("link");
    authIframeHtml.href = url;
    authIframeHtml.crossOrigin = "anonymous";
    authIframeHtml.type = "text/html";
    authIframeHtml.rel = "prefetch";
    if (authIframeHtml.relList && authIframeHtml.relList.supports) {
      if (authIframeHtml.relList.supports("prefetch")) {
        document.head.appendChild(authIframeHtml);
      }
    }
  } catch (error) {
    log.error(error);
  }
};

export class AuthProvider {
  public sdkUrl: string;

  public initialized: boolean = false;

  private iframeElem: HTMLIFrameElement;

  private iframeLoadPromise: Promise<void> | null = null;

  private loginCallbackSuccess: ((value: { sessionId?: string; sessionNamespace?: string }) => void) | null = null;

  private loginCallbackFailed: ((reason?: string) => void) | null = null;

  constructor({ sdkUrl }: { sdkUrl: string }) {
    this.sdkUrl = sdkUrl;
  }

  get targetOrigin(): string {
    return new URL(this.sdkUrl).origin;
  }

  async loadIframe(): Promise<void> {
    const documentIFrameElem = document.getElementById(IFRAME_MODAL_ID) as HTMLIFrameElement;
    if (documentIFrameElem) {
      log.info("already initialized, removing previous modal iframe");
      documentIFrameElem.remove();
    }

    const authIframeUrl = new URL(this.sdkUrl);
    if (authIframeUrl.pathname.endsWith("/")) authIframeUrl.pathname += "frame";
    else authIframeUrl.pathname += "/frame";

    const hashParams = new URLSearchParams();
    hashParams.append("origin", window.location.origin);

    authIframeUrl.hash = hashParams.toString();

    this.iframeElem = htmlToElement<HTMLIFrameElement>(
      `<iframe
        id=${IFRAME_MODAL_ID}
        class="web3auth-iframe"
        sandbox="allow-popups allow-scripts allow-same-origin allow-forms allow-modals allow-downloads"
        src="${authIframeUrl.href}"
        style="display: none; position: fixed; top: 0; right: 0; width: 100%; z-index: 10000000;
        height: 100%; border: none; border-radius: 0;"
      ></iframe>`
    );

    document.body.appendChild(this.iframeElem);
    this.iframeLoadPromise = new Promise<void>((resolve) => {
      this.iframeElem.onload = () => {
        // TODO: use ack from the iframe to set this flag.
        this.initialized = true;
        this.setupMessageListener();
        resolve();
      };
    });
  }

  public async postInitMessage({ network, clientId }: { network: WEB3AUTH_NETWORK_TYPE; clientId: string }) {
    await this.iframeLoadPromise;
    this.iframeElem.contentWindow?.postMessage(
      {
        type: JRPC_METHODS.INIT_DAPP,
        data: {
          network,
          clientId,
        },
      },
      this.targetOrigin
    );
  }

  public postLoginInitiatedMessage(loginConfig: AuthSessionConfig, nonce?: string) {
    if (!this.initialized) throw new Error("Iframe not initialized");
    this.iframeElem.contentWindow?.postMessage(
      {
        type: JRPC_METHODS.LOGIN_INITIATED,
        data: { loginConfig, nonce },
      },
      this.targetOrigin
    );
    return new Promise<{ sessionId?: string; sessionNamespace?: string; error?: string }>((resolve, reject) => {
      this.loginCallbackSuccess = resolve;
      this.loginCallbackFailed = reject;
    });
  }

  public postLoginCancelledMessage(nonce: string) {
    if (!this.initialized) throw new Error("Iframe not initialized");
    this.iframeElem.contentWindow?.postMessage(
      {
        type: JRPC_METHODS.LOGIN_CANCELLED,
        data: { nonce },
      },
      this.targetOrigin
    );
  }

  private setupMessageListener() {
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent) {
    const { origin, data } = event as {
      origin: string;
      data: { type: string; data: { sessionId?: string; sessionNamespace?: string; error?: string } };
    };
    // the origin should be the same as the target origin
    if (origin !== this.targetOrigin) return;
    const { type } = data;
    const messageData = data.data;
    switch (type) {
      case JRPC_METHODS.LOGIN_FAILED:
        this.loginCallbackFailed?.(messageData?.error || "Login failed, reason: unknown");
        break;
      case JRPC_METHODS.DISPLAY_IFRAME:
        this.iframeElem.style.display = "block";
        break;
      case JRPC_METHODS.HIDE_IFRAME:
        this.iframeElem.style.display = "none";
        break;
      case JRPC_METHODS.LOGIN_SUCCESS:
        log.info("LOGIN_SUCCESS", messageData);
        this.iframeElem.style.display = "none";
        if (messageData?.sessionId) this.loginCallbackSuccess?.(messageData);
        break;
      default:
        log.warn(`Unknown message type: ${type}`);
        break;
    }
  }
}
