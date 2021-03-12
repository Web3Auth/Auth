export * as keccak from "keccak";
export declare type OriginData = {
    [P in string]: string;
};
export declare type UserData = {
    [P in string]: string;
};
export declare type SessionInfo = {
    _pid: string;
    _user: string;
    _userSig: string;
    _userData: UserData;
    _origin: string;
    _originData: OriginData;
    _clientId: string;
};
export declare type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";
export { default as base64url } from "base64url";
export declare function base64toJSON(b64str: string): Record<string, unknown>;
export declare function jsonToBase64(json: Record<string, unknown>): string;
