import b64url from "base64url";

export type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";

export function base64toJSON(b64str: string): Record<string, unknown> {
  return JSON.parse(b64url.decode(b64str));
}

export function jsonToBase64(json: Record<string, unknown>): string {
  return b64url.encode(JSON.stringify(json));
}
