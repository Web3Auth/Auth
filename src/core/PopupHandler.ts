import { SESSION_SERVER_API_URL, SESSION_SERVER_SOCKET_URL } from "@toruslabs/constants";
import { getPopupFeatures } from "@toruslabs/customauth";
import { SecurePubSub } from "@toruslabs/secure-pub-sub";
import { EventEmitter } from "events";
import type { default as TypedEmitter } from "typed-emitter";

import { LoginCallbackSuccess } from "../utils";
import { LoginError } from "./errors";

export type PopupResponse = LoginCallbackSuccess & {
  state?: string;
  error?: string;
};

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

  socketUrl: string;

  serverUrl: string;

  securePubSub: SecurePubSub | null = null;

  constructor({
    url,
    target,
    features,
    timeout = 30000,
    socketUrl,
    serverUrl,
  }: {
    url: string;
    target?: string;
    features?: string;
    timeout?: number;
    socketUrl?: string;
    serverUrl?: string;
  }) {
    // Disabling the rule here, as it is a false positive.

    super();
    this.url = url;
    this.target = target || "_blank";
    this.features = features || getPopupFeatures();
    this.window = undefined;
    this.windowTimer = undefined;
    this.iClosedWindow = false;
    this.timeout = timeout;
    this.serverUrl = serverUrl || SESSION_SERVER_API_URL;
    this.socketUrl = socketUrl || SESSION_SERVER_SOCKET_URL;
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
    if (this.securePubSub) {
      this.securePubSub.cleanup();
      this.securePubSub = null;
    }
  }

  redirect(locationReplaceOnRedirect: boolean): void {
    if (locationReplaceOnRedirect) {
      window.location.replace(this.url);
    } else {
      window.location.href = this.url;
    }
  }

  async listenOnChannel(loginId: string): Promise<PopupResponse> {
    this.securePubSub = new SecurePubSub({
      serverUrl: this.serverUrl,
      socketUrl: this.socketUrl,
      sameIpCheck: true,
      allowedOrigin: true,
    });
    const data = await this.securePubSub.subscribe(loginId);
    this.close();
    const parsedData = JSON.parse(data) as {
      error?: string;
      state?: string;
      data?: Omit<PopupResponse, "state" | "error"> | null;
    };
    if (parsedData.error) {
      return { error: parsedData.error, state: parsedData.state };
    }
    return parsedData.data;
  }
}

export default PopupHandler;
