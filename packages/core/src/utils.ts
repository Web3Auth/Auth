import { JRPCResponse } from "./jrpc";

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

export const randomId = (): number => Math.floor((Math.random() * Number.MAX_SAFE_INTEGER) / 2);

export type Maybe<T> = Partial<T> | null | undefined;

export type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";
