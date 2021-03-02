export type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";

export function base64toJSON(b64str: string): Record<string, unknown> {
  return JSON.parse(atob(b64str));
}

export function jsonToBase64(json: Record<string, unknown>): string {
  return btoa(JSON.stringify(json));
}
