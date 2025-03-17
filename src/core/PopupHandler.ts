import { SESSION_SERVER_API_URL, SESSION_SERVER_SOCKET_URL } from "@toruslabs/constants";
import { getPopupFeatures } from "@toruslabs/customauth";
import { SecurePubSub } from "@toruslabs/secure-pub-sub";
import { EventEmitter } from "events";
import type { default as TypedEmitter } from "typed-emitter";

import { LoginError } from "./errors";

export interface PopupResponse {
  sessionId?: string;
  sessionNamespace?: string;
  state?: string;
  error?: string;
}

export type PopupHandlerEvents = {
  close: () => void;
};

class PopupHandler extends (EventEmitter as new () => TypedEmitter<PopupHandlerEvents>) {
  url: string;

  target: string;

  features: string;

  window: Window;

  windowTimer: number;

  iClosedWindow: boolean;

  timeout: number;

  sessionSocketUrl: string;

  sessionServerUrl: string;

  constructor({
    url,
    target,
    features,
    timeout = 30000,
    sessionSocketUrl,
    sessionServerUrl,
  }: {
    url: string;
    target?: string;
    features?: string;
    timeout?: number;
    sessionSocketUrl?: string;
    sessionServerUrl?: string;
  }) {
    // Disabling the rule here, as it is a false positive.
    // eslint-disable-next-line constructor-super
    super();
    this.url = url;
    this.target = target || "_blank";
    this.features = features || getPopupFeatures();
    this.window = undefined;
    this.windowTimer = undefined;
    this.iClosedWindow = false;
    this.timeout = timeout;
    this.sessionServerUrl = sessionServerUrl || SESSION_SERVER_API_URL;
    this.sessionSocketUrl = sessionSocketUrl || SESSION_SERVER_SOCKET_URL;
    this._setupTimer();
  }

  _setupTimer(): void {
    this.windowTimer = Number(
      setInterval(() => {
        if (this.window && this.window.closed) {
          clearInterval(this.windowTimer);
          setTimeout(() => {
            if (!this.iClosedWindow) {
              this.emit("close");
            }
            this.iClosedWindow = false;
            this.window = undefined;
          }, this.timeout);
        }
        if (this.window === undefined) clearInterval(this.windowTimer);
      }, 500)
    );
  }

  open(): void {
    this.window = window.open(this.url, this.target, this.features);
    if (!this.window) throw LoginError.popupBlocked();
    if (this.window?.focus) this.window.focus();
  }

  close(): void {
    this.iClosedWindow = true;
    if (this.window) this.window.close();
  }

  redirect(locationReplaceOnRedirect: boolean): void {
    if (locationReplaceOnRedirect) {
      window.location.replace(this.url);
    } else {
      window.location.href = this.url;
    }
  }

  async listenOnChannel(loginId: string): Promise<PopupResponse> {
    const securePubSub = new SecurePubSub({ serverUrl: this.sessionServerUrl, socketUrl: this.sessionSocketUrl });
    const data = await securePubSub.subscribe(loginId);
    this.close();
    securePubSub.cleanup();
    const parsedData = JSON.parse(data) as { error?: string; state?: string; data?: { sessionId?: string; sessionNamespace?: string } };
    if (parsedData.error) {
      return { error: parsedData.error, state: parsedData.state };
    }
    return parsedData.data;
  }
}

export default PopupHandler;
