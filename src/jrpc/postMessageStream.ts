import type { DuplexOptions } from "readable-stream";

import { BasePostMessageStream, isValidStreamMessage, type PostMessageEvent } from "./basePostMessageStream";

/* istanbul ignore next */
const getSource = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "source")?.get;

/* istanbul ignore next */
const getOrigin = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "origin")?.get;

export interface PostMessageStreamArgs extends DuplexOptions {
  name: string;
  target: string;
  targetOrigin?: string;
  targetWindow?: Window;
}

export class PostMessageStream extends BasePostMessageStream {
  private _name: string;

  private _target: string;

  private _targetOrigin: string;

  private _targetWindow: Window;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _onMessage: any;

  constructor({ name, target, targetOrigin = "*", targetWindow = window, ...streamOptions }: PostMessageStreamArgs) {
    super(streamOptions);

    if (typeof window === "undefined" || typeof window.postMessage !== "function") {
      throw new Error("window.postMessage is not a function. This class should only be instantiated in a Window.");
    }

    this._name = name;
    this._target = target;
    this._targetOrigin = targetOrigin;
    this._targetWindow = targetWindow;
    this._onMessage = this._onMessageHandler.bind(this);

    window.addEventListener("message", this._onMessage, false);

    this._handshake();
  }

  _destroy(): void {
    window.removeEventListener("message", this._onMessage, false);
  }

  protected _postMessage(data: unknown): void {
    let originConstraint = this._targetOrigin;
    if (typeof data === "object") {
      const dataObj = data as Record<string, unknown>;
      if (typeof dataObj.data === "object") {
        const dataObjData = dataObj.data as Record<string, unknown>;
        if (Array.isArray(dataObjData.params) && dataObjData.params.length > 0) {
          const dataObjDataParam = dataObjData.params[0] as Record<string, unknown>;
          if (dataObjDataParam._origin) {
            originConstraint = dataObjDataParam._origin as string;
          }

          dataObjDataParam._origin = window.location.origin;
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

  private _onMessageHandler(event: PostMessageEvent): void {
    const message = event.data;

    if (
      (this._targetOrigin !== "*" && (getOrigin ? getOrigin.call(event) : event.origin) !== this._targetOrigin) ||
      (getSource ? getSource.call(event) : event.source) !== this._targetWindow ||
      !isValidStreamMessage(message) ||
      (message as Record<string, unknown>).target !== this._name
    ) {
      return;
    }

    this._onData(message.data);
  }
}
