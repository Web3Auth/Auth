import { Duplex } from "stream";

function noop(): void {
  return undefined;
}

const SYN = "SYN";
const ACK = "ACK";

export default class PostMessageStream extends Duplex {
  _init: boolean;

  _haveSyn: boolean;

  _name: string;

  _target: string;

  _targetWindow: Window;

  _origin: string;

  _onMessage: any;

  constructor({ name, target, targetWindow }: { name: string; target: string; targetWindow: Window }) {
    super({
      objectMode: true,
    });
    this._init = false;
    this._haveSyn = false;
    this._name = name;
    this._target = target; // target origin
    this._targetWindow = targetWindow || window;
    this._origin = targetWindow ? "*" : window.location.origin;
    this._onMessage = this.onMessage.bind(this);

    window.addEventListener("message", this._onMessage, false);
    this._handShake();
  }

  _handShake(): void {
    this._write(SYN, null, noop);
    this.cork();
  }

  _onData(data: unknown): void {
    if (!this._init) {
      // listen for handshake
      if (data === SYN) {
        this._haveSyn = true;
        this._write(ACK, null, noop);
      } else if (data === ACK) {
        this._init = true;
        if (!this._haveSyn) {
          this._write(ACK, null, noop);
        }
        this.uncork();
      }
    } else {
      // forward message
      try {
        this.push(data);
      } catch (err) {
        this.emit("error", err);
      }
    }
  }

  _postMessage(data: unknown): void {
    let originConstraint = this._origin;
    if (typeof data === "object") {
      const dataObj = data as Record<string, unknown>;
      if (typeof dataObj.data === "object") {
        const datadataObj = dataObj.data as Record<string, unknown>;
        if (datadataObj._redirectUrl) {
          originConstraint = datadataObj._redirectUrl as string;
        }
      }
    }
    this._targetWindow.postMessage(
      {
        target: this._target,
        data,
      },
      originConstraint
    );
  }

  onMessage(event: MessageEvent): void {
    const message = event.data;

    // validate message
    if (
      (this._origin !== "*" && event.origin !== this._origin) ||
      event.source !== this._targetWindow ||
      typeof message !== "object" ||
      message.target !== this._name ||
      !message.data
    ) {
      return;
    }

    this._onData(message.data);
  }

  // eslint-disable-next-line class-methods-use-this
  _read(): void {
    return undefined;
  }

  _write(data: unknown, _, cb: () => void): void {
    this._postMessage(data);
    cb();
  }
}
