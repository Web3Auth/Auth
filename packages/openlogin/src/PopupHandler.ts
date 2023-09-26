import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import { EventEmitter } from "events";

import { getPopupFeatures } from "./utils";

export interface PopupResponse {
  sessionId?: string;
  sessionNamespace?: string;
  state?: string;
  error?: string;
}
class PopupHandler extends EventEmitter {
  url: string;

  target: string;

  features: string;

  window: Window;

  windowTimer: number;

  iClosedWindow: boolean;

  timeout: number;

  constructor({ url, target, features, timeout = 30000 }: { url: string; target?: string; features?: string; timeout?: number }) {
    super();
    this.url = url;
    this.target = target || "_blank";
    this.features = features || getPopupFeatures();
    this.window = undefined;
    this.windowTimer = undefined;
    this.iClosedWindow = false;
    this.timeout = timeout;
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
    return new Promise<PopupResponse>((resolve, _reject) => {
      const bc = new BroadcastChannel<{ error?: string; data?: PopupResponse; state?: string }>(loginId, {
        webWorkerSupport: false,
        type: "server",
      });
      bc.addEventListener("message", (ev) => {
        this.close();
        bc.close();
        if (ev.error) {
          resolve({ error: ev.error, state: ev.state });
        } else {
          resolve(ev.data);
        }
      });
    });
  }
}

export default PopupHandler;
