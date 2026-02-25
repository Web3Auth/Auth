import { randomId } from "@toruslabs/customauth";

import { AUTH_SERVICE_PRODUCTION_URL, IFRAME_MODAL_ID, JRPC_METHODS } from "../utils/constants";
import {
  type AuthFlowResult,
  AuthRequestPayload,
  AuthTokenResponse,
  THEME_MODE_TYPE,
  THEME_MODES,
  WEB3AUTH_NETWORK_TYPE,
  WhiteLabelData,
} from "../utils/interfaces";
import { log } from "../utils/logger";
import { htmlToElement } from "../utils/utils";
import { isAuthFlowError } from "./utils";

export async function preloadIframe() {
  try {
    if (typeof document === "undefined") return;
    const authIframeHtml = document.createElement("link");
    authIframeHtml.href = `${AUTH_SERVICE_PRODUCTION_URL}/frame`;
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
}

const authServiceIframeMap: Map<string, HTMLIFrameElement> = new Map();

function getTheme(theme: THEME_MODE_TYPE): string {
  if (theme === THEME_MODES.light) return "light";
  if (theme === THEME_MODES.dark) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export class AuthProvider {
  public sdkUrl: string;
  public whiteLabel: WhiteLabelData;

  public initialized: boolean = false;

  private loginCallbackSuccess: ((value: AuthTokenResponse) => void) | null = null;

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

  registerAuthServiceIframe(iframe: HTMLIFrameElement) {
    authServiceIframeMap.set(this.embedNonce, iframe);
  }

  public cleanup() {
    const iframe = authServiceIframeMap.get(this.embedNonce);
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
      authServiceIframeMap.delete(this.embedNonce);
    }
  }

  async init({ network, clientId }: { network: WEB3AUTH_NETWORK_TYPE; clientId: string }): Promise<void> {
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

    this.registerAuthServiceIframe(authServiceIframe);

    return new Promise<void>((resolve, reject) => {
      try {
        window.document.body.appendChild(authServiceIframe);

        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== this.targetOrigin) return;
          const { data } = event as {
            data: { type: string; nonce: string; data: AuthFlowResult };
          };
          const { type, nonce } = data;
          // dont do anything if the nonce is not the same.
          if (nonce !== this.embedNonce) return;
          const messageData = data.data;
          switch (type) {
            case JRPC_METHODS.SETUP_COMPLETE:
              this.getAuthServiceIframe()?.contentWindow?.postMessage(
                {
                  type: JRPC_METHODS.INIT_DAPP,
                  data: {
                    network,
                    clientId,
                  },
                },
                this.targetOrigin
              );
              this.initialized = true;
              resolve();
              break;
            case JRPC_METHODS.LOGIN_FAILED:
              this.loginCallbackFailed?.(isAuthFlowError(messageData) ? messageData.error : "Login failed, reason: unknown");
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
              if (messageData && !isAuthFlowError(messageData)) this.loginCallbackSuccess?.(messageData);
              break;
            default:
              log.warn(`Unknown message type: ${type}`);
              break;
          }
        };

        window.addEventListener("message", handleMessage);
      } catch (error) {
        reject(error);
      }
    });
  }

  public postLoginInitiatedMessage(loginConfig: AuthRequestPayload, nonce?: string) {
    if (!this.initialized) throw new Error("Iframe not initialized");
    this.getAuthServiceIframe().contentWindow?.postMessage(
      {
        type: JRPC_METHODS.LOGIN_INITIATED,
        data: { loginConfig, nonce },
      },
      this.targetOrigin
    );
    return new Promise<AuthTokenResponse>((resolve, reject) => {
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
}
