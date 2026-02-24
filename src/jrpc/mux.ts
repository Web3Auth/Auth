import once from "once";
import type { DuplexOptions } from "readable-stream";
import { Duplex, finished, pipeline } from "readable-stream";

import { Substream } from "./substream";

export const IGNORE_SUBSTREAM = Symbol("IGNORE_SUBSTREAM");

interface Chunk {
  name: string;
  data: unknown;
}

export class ObjectMultiplex extends Duplex {
  private _substreams: Record<string, Substream | typeof IGNORE_SUBSTREAM>;

  constructor(opts: DuplexOptions = {}) {
    super({
      objectMode: true,
      ...opts,
    });
    this._substreams = {};
  }

  createStream(name: string, opts: DuplexOptions = {}): Substream {
    if (this.destroyed) {
      throw new Error(`ObjectMultiplex - parent stream for name "${name}" already destroyed`);
    }

    if (this._readableState.ended || this._writableState.ended) {
      throw new Error(`ObjectMultiplex - parent stream for name "${name}" already ended`);
    }

    if (!name) {
      throw new Error("ObjectMultiplex - name must not be empty");
    }

    if (this._substreams[name]) {
      throw new Error(`ObjectMultiplex - Substream for name "${name}" already exists`);
    }

    const substream = new Substream({ parent: this, name, ...opts });
    this._substreams[name] = substream;

    anyStreamEnd(this, (_error?: Error | null) => substream.destroy(_error || undefined));

    return substream;
  }

  ignoreStream(name: string): void {
    if (!name) {
      throw new Error("ObjectMultiplex - name must not be empty");
    }
    if (this._substreams[name]) {
      throw new Error(`ObjectMultiplex - Substream for name "${name}" already exists`);
    }
    this._substreams[name] = IGNORE_SUBSTREAM;
  }

  _read(): void {
    return undefined;
  }

  _write(chunk: Chunk, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    const { name, data } = chunk;

    if (!name) {
      // eslint-disable-next-line no-console
      console.warn(`ObjectMultiplex - malformed chunk without name "${chunk}"`);
      return callback();
    }

    const substream = this._substreams[name];
    if (!substream) {
      // eslint-disable-next-line no-console
      console.warn(`ObjectMultiplex - orphaned data for stream "${name}"`);
      return callback();
    }

    if (substream !== IGNORE_SUBSTREAM) {
      substream.push(data);
    }

    return callback();
  }
}

function anyStreamEnd(stream: ObjectMultiplex, _cb: (error?: Error | null) => void) {
  const cb = once(_cb);
  finished(stream, { readable: false }, cb);
  finished(stream, { writable: false }, cb);
}

export function setupMultiplex(stream: Duplex): ObjectMultiplex {
  const mux = new ObjectMultiplex();
  pipeline(stream, mux, stream, (err) => {
    // For context and todos related to the error message match, see https://github.com/MetaMask/metamask-extension/issues/26337
    if (err && !err.message?.match("Premature close")) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });
  return mux;
}
