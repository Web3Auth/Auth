import { JRPCResponse } from "./jrpc";
import SerializableError from "./serializableError";

export async function documentReady(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (document.readyState !== "loading") {
      resolve();
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        resolve();
      });
    }
  });
}

export function serializeError(error: Error | SerializableError<any>): string {
  return error.toString();
}

export type Json = boolean | number | string | null | { [property: string]: Json } | Json[];

export const getRpcPromiseCallback = (resolve: (value?: any) => void, reject: (error?: Error) => void, unwrapResult = true) => (
  error: Error,
  response: JRPCResponse<unknown>
): void => {
  if (error || response.error) {
    reject(error || response.error);
  } else if (!unwrapResult || Array.isArray(response)) {
    resolve(response);
  } else {
    resolve(response.result);
  }
};

export type Maybe<T> = Partial<T> | null | undefined;

export type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";
