import keccakLib from "keccak";
export declare const keccak: typeof keccakLib;
export declare type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";
export declare const base64url: import("base64url").Base64Url;
export declare function base64toJSON(b64str: string): Record<string, unknown>;
export declare function jsonToBase64(json: Record<string, unknown>): string;
