import { randomId } from "@toruslabs/customauth";
import { IFRAME_MODAL_ID, JRPC_METHODS } from "../utils/constants";
import { AuthSessionConfig, THEME_MODE_TYPE, THEME_MODES, WEB3AUTH_NETWORK_TYPE, WhiteLabelData } from "../utils/interfaces";
import { log } from "../utils/logger";
import { htmlToElement } from "../utils/utils";

(async function preloadIframe() {
  try {
    if (typeof document === "undefined") return;
    const authIframeHtml = document.createElement("link");
    authIframeHtml.href = "https://auth.web3auth.io/frame";
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
})();

let authServiceIframeMap: Map<string, HTMLIFrameElement> = new Map();

function getTheme(theme: THEME_MODE_TYPE): string {
  if (theme === THEME_MODES.light) return "light";
  if (theme === THEME_MODES.dark) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export class AuthProvider {
  public sdkUrl: string;
  public whiteLabel: WhiteLabelData;

  public initialized: boolean = false;

  private iframeLoadPromise: Promise<void> | null = null;

  private loginCallbackSuccess: ((value: { sessionId?: string; sessionNamespace?: string }) => void) | null = null;

  private loginCallbackFailed: ((reason?: string) => void) | null = null;

  private readonly embedNonce = randomId();

  constructor({ sdkUrl, whiteLabel }: { sdkUrl: string; whiteLabel: WhiteLabelData }) {
    this.sdkUrl = sdkUrl;
    this.whiteLabel = whiteLabel;
  }

  get targetOrigin(): string {
    return new URL(this.sdkUrl).origin;
  }

  getAuthServiceIframe(): HTMLIFrameElement {
    return authServiceIframeMap.get(this.embedNonce) as HTMLIFrameElement;
  }

  async loadIframe(): Promise<void> {
    if (typeof window === "undefined" || typeof document === "undefined") throw new Error("window or document is not available");
    if (this.initialized) throw new Error("AuthProvider already initialized");

    const authIframeUrl = new URL(this.sdkUrl);
    if (authIframeUrl.pathname.endsWith("/")) authIframeUrl.pathname += "frame";
    else authIframeUrl.pathname += "/frame";

    const hashParams = new URLSearchParams();
    hashParams.append("origin", window.location.origin);
    hashParams.append("nonce", this.embedNonce);
    authIframeUrl.hash = hashParams.toString();

    const colorScheme = getTheme(this.whiteLabel.mode || THEME_MODES.light);

    const authServiceIframe = htmlToElement<HTMLIFrameElement>(
      `<iframe
        id="${IFRAME_MODAL_ID}-${this.embedNonce}"
        class="${IFRAME_MODAL_ID}-${this.embedNonce}"
        sandbox="allow-popups allow-scripts allow-same-origin allow-forms allow-modals allow-downloads"
        src="${authIframeUrl.href}"
        style="display: none; position: fixed; top: 0; right: 0; width: 100%; z-index: 10000000;
        height: 100%; border: none; border-radius: 0; color-scheme: ${colorScheme};"
        allow="clipboard-write"
      ></iframe>`
    );
    authServiceIframeMap.set(this.embedNonce, authServiceIframe);

    window.document.body.appendChild(authServiceIframe);
    this.iframeLoadPromise = new Promise<void>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== this.targetOrigin) return;
        const { message, nonce } = event.data;
        if (message === JRPC_METHODS.INIT_DAPP && nonce === this.embedNonce) {
          // TODO: use ack from the iframe to set this flag.
          this.setupMessageListener();
          this.initialized = true;
          resolve();
        }
      };
      window.addEventListener("message", handleMessage);
    });
  }

  public async postInitMessage({ network, clientId }: { network: WEB3AUTH_NETWORK_TYPE; clientId: string }) {
    await this.iframeLoadPromise;
    if (!this.initialized) throw new Error("Iframe not initialized");
    this.getAuthServiceIframe().contentWindow?.postMessage(
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
    this.getAuthServiceIframe().contentWindow?.postMessage(
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
    this.getAuthServiceIframe().contentWindow?.postMessage(
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
        this.getAuthServiceIframe().style.display = "block";
        break;
      case JRPC_METHODS.HIDE_IFRAME:
        this.getAuthServiceIframe().style.display = "none";
        break;
      case JRPC_METHODS.LOGIN_SUCCESS:
        log.info("LOGIN_SUCCESS", messageData);
        this.getAuthServiceIframe().style.display = "none";
        if (messageData?.sessionId) this.loginCallbackSuccess?.(messageData);
        break;
      default:
        log.warn(`Unknown message type: ${type}`);
        break;
    }
  }
}
