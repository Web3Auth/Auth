// ──────────────────────────────────────────────────────────────────────────────
// JRPC V1 exports — DEPRECATED
//
// The V1 engine, middleware types, and stream utilities below are deprecated.
// Migrate to the JRPC V2 API exported from "./v2" (e.g. JRPCEngineV2,
// JRPCMiddlewareV2, createEngineStreamV2, providerFromEngineV2, etc.).
// ──────────────────────────────────────────────────────────────────────────────

export type { PostMessageEvent, StreamData, StreamMessage } from "./basePostMessageStream";
export { BasePostMessageStream, isValidStreamMessage } from "./basePostMessageStream";
export * from "./errors";
export * from "./interfaces";
export * from "./jrpc";
export * from "./jrpcEngine";
export * from "./mux";
export type { PostMessageStreamArgs } from "./postMessageStream";
export { PostMessageStream } from "./postMessageStream";
export { SafeEventEmitter } from "./safeEventEmitter";
export { SerializableError } from "./serializableError";
export type { SubstreamOptions } from "./substream";
export { Substream } from "./substream";

/**
 * JRPC V2 API — preferred.
 */
export * from "./v2";
