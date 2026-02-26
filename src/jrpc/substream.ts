import type { DuplexOptions } from "readable-stream";
import { Duplex } from "readable-stream";

import type { ObjectMultiplex } from "./mux";

export interface SubstreamOptions extends DuplexOptions {
  parent: ObjectMultiplex;
  name: string;
}

export class Substream extends Duplex {
  private readonly _parent: ObjectMultiplex;

  private readonly _name: string;

  constructor({ parent, name, ...streamOptions }: SubstreamOptions) {
    super({
      objectMode: true,
      ...streamOptions,
    });
    this._parent = parent;
    this._name = name;
  }

  /**
   * Explicitly sets read operations to a no-op.
   */
  _read(): void {
    return undefined;
  }

  /**
   * Called when data should be written to this writable stream.
   *
   * @param chunk - Arbitrary object to write
   * @param encoding - Encoding to use when writing payload
   * @param callback - Called when writing is complete or an error occurs
   */
  _write(chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this._parent.push({
      name: this._name,
      data: chunk,
    });
    callback();
  }
}
