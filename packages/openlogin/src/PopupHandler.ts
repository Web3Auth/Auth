import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import { EventEmitter } from "events";

import { getPopupFeatures } from "./utils";

class PopupHandler extends EventEmitter {
  url: string;

  target: string;

  features: string;

  window: Window;

  windowTimer: number;

  iClosedWindow: boolean;

  constructor({ url, target, features }: { url: string; target?: string; features?: string }) {
    super();
    this.url = url;
    this.target = target || "_blank";
    this.features = features || getPopupFeatures();
    this.window = undefined;
    this.windowTimer = undefined;
    this.iClosedWindow = false;
    this._setupTimer();
  }

  _setupTimer(): void {
    this.windowTimer = Number(
      setInterval(() => {
        if (this.window && this.window.closed) {
          clearInterval(this.windowTimer);
          if (!this.iClosedWindow) {
            this.emit("close");
          }
          this.iClosedWindow = false;
          this.window = undefined;
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

  async listenOnChannel(loginId: string): Promise<{ sessionId: string; sessionNamespace?: string }> {
    return new Promise<{ sessionId: string; sessionNamespace?: string }>((resolve, reject) => {
      const bc = new BroadcastChannel<{ error?: string; data?: { sessionId: string; sessionNamespace?: string } }>(loginId, {
        webWorkerSupport: false,
        type: "server",
      });
      bc.addEventListener("message", (ev) => {
        this.close();
        bc.close();
        if (ev.error) {
          reject(new Error(ev.error));
        } else {
          resolve(ev.data);
        }
      });
    });
  }
}

export default PopupHandler;
