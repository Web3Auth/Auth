import base64urlLib from "base64url";

export const base64url = base64urlLib;

export function safebtoa(str: string): string {
  return base64url.encode(str);
}

export function safeatob(str: string): string {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return base64url.decode(str);
}

export function base64toJSON<T = Record<string, unknown>>(b64str: string): T {
  return JSON.parse(base64url.decode(b64str));
}

export function jsonToBase64<T = Record<string, unknown>>(json: T): string {
  return base64url.encode(JSON.stringify(json));
}

export interface IStorage {
  getItem(key: string): string;
  setItem(key: string, value: string): void;
}

export function storageAvailable(type: string): boolean {
  let storageExists = false;
  let storageLength = 0;
  let storage: Storage;
  try {
    storage = window[type];
    storageExists = true;
    storageLength = storage.length;
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (error) {
    return (
      error &&
      // everything except Firefox
      (error.code === 22 ||
        // Firefox
        error.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        error.name === "QuotaExceededError" ||
        // Firefox
        error.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
      // acknowledge QuotaExceededError only if there's something already stored
      storageExists &&
      storageLength !== 0
    );
  }
}
