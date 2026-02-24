import type { DuplexOptions } from "readable-stream";
import { Duplex } from "readable-stream";

function noop(): void {
  return undefined;
}

const SYN = "SYN";
const ACK = "ACK";

type Log = (data: unknown, out: boolean) => void;

export type StreamData = number | string | Record<string, unknown> | unknown[];

export interface StreamMessage {
  [key: string]: unknown;
  data: StreamData;
}

export interface PostMessageEvent {
  data?: StreamData;
  origin: string;
  source: typeof window;
}

export function isValidStreamMessage(message: unknown): message is StreamMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    Boolean((message as StreamMessage).data) &&
    (typeof (message as StreamMessage).data === "number" ||
      typeof (message as StreamMessage).data === "object" ||
      typeof (message as StreamMessage).data === "string")
  );
}

export abstract class BasePostMessageStream extends Duplex {
  private _init: boolean;

  private _haveSyn: boolean;

  private _log: Log;

  constructor(streamOptions?: DuplexOptions) {
    super({
      objectMode: true,
      ...streamOptions,
    });

    this._init = false;
    this._haveSyn = false;
    this._log = () => null;
  }

  _read(): void {
    return undefined;
  }

  _write(data: StreamData, _encoding: string | null, cb: () => void): void {
    if (data !== ACK && data !== SYN) {
      this._log(data, true);
    }
    this._postMessage(data);
    cb();
  }

  _setLogger(log: Log): void {
    this._log = log;
  }

  protected _handshake(): void {
    this._write(SYN, null, noop);
    this.cork();
  }

  protected _onData(data: StreamData): void {
    if (this._init) {
      try {
        this.push(data);
        this._log(data, false);
      } catch (err) {
        this.emit("error", err);
      }
    } else if (data === SYN) {
      this._haveSyn = true;
      this._write(ACK, null, noop);
    } else if (data === ACK) {
      this._init = true;
      if (!this._haveSyn) {
        this._write(ACK, null, noop);
      }
      this.uncork();
    }
  }

  protected abstract _postMessage(_data?: unknown): void;
}
