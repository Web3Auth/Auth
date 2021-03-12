import base64url from "base64url";

export * as keccak from "keccak";

export type OriginData = {
  [P in string]: string;
};

export type UserData = {
  [P in string]: string;
};

export type SessionInfo = {
  _pid: string;
  _user: string;
  _userSig: string;
  _userData: UserData;
  _origin: string;
  _originData: OriginData;
  _clientId: string;
};

export type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";

export { default as base64url } from "base64url";

export function base64toJSON(b64str: string): Record<string, unknown> {
  return JSON.parse(base64url.decode(b64str));
}

export function jsonToBase64(json: Record<string, unknown>): string {
  return base64url.encode(JSON.stringify(json));
}
