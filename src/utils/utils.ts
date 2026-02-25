import { decodeBase64Url, encodeBase64Url } from "@toruslabs/metadata-helpers";

export function safebtoa(str: string): string {
  return encodeBase64Url(str);
}

export function safeatob(str: string): string {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeBase64Url(str);
}

export function base64toJSON<T = Record<string, unknown>>(b64str: string): T {
  return JSON.parse(decodeBase64Url(b64str));
}

export function jsonToBase64<T = Record<string, unknown>>(json: T): string {
  return encodeBase64Url(JSON.stringify(json));
}

export const htmlToElement = <T extends Element>(html: string): T => {
  const template = window.document.createElement("template");
  const trimmedHtml = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = trimmedHtml;
  return template.content.firstChild as T;
};

export function cloneDeep<T>(object: T): T {
  try {
    return structuredClone(object);
  } catch {
    return JSON.parse(JSON.stringify(object));
  }
}

export function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function hasProperty<Key extends PropertyKey>(value: unknown, key: Key): value is Record<Key, unknown> {
  return isObject(value) && key in value;
}
