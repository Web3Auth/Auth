import stringify from "fast-safe-stringify";

import { JRPCRequest, Json } from "./interfaces";

enum CacheStrategy {
  /**
   * Cache per-block.
   */
  Block = "block",
  /**
   * Cache until a chain reorganization occurs.
   */
  Fork = "fork",
  /**
   * Never cache.
   */
  Never = "never",
  /**
   * Permanently cache.
   */
  Permanent = "perma",
}

function blockTagParamIndex(method: string): number | undefined {
  switch (method) {
    // blockTag is at index 2
    case "eth_getStorageAt":
      return 2;
    // blockTag is at index 1
    case "eth_getBalance":
    case "eth_getCode":
    case "eth_getTransactionCount":
    case "eth_call":
      return 1;
    // blockTag is at index 0
    case "eth_getBlockByNumber":
      return 0;
    // there is no blockTag
    default:
      return undefined;
  }
}

function cacheTypeForMethod(method: string): CacheStrategy {
  switch (method) {
    // cache permanently
    case "web3_clientVersion":
    case "web3_sha3":
    case "eth_protocolVersion":
    case "eth_getBlockTransactionCountByHash":
    case "eth_getUncleCountByBlockHash":
    case "eth_getCode":
    case "eth_getBlockByHash":
    case "eth_getTransactionByHash":
    case "eth_getTransactionByBlockHashAndIndex":
    case "eth_getTransactionReceipt":
    case "eth_getUncleByBlockHashAndIndex":
    case "eth_getCompilers":
    case "eth_compileLLL":
    case "eth_compileSolidity":
    case "eth_compileSerpent":
    case "shh_version":
    case "test_permaCache":
      return CacheStrategy.Permanent;

    // cache until fork
    case "eth_getBlockByNumber":
    case "eth_getBlockTransactionCountByNumber":
    case "eth_getUncleCountByBlockNumber":
    case "eth_getTransactionByBlockNumberAndIndex":
    case "eth_getUncleByBlockNumberAndIndex":
    case "test_forkCache":
      return CacheStrategy.Fork;

    // cache for block
    case "eth_gasPrice":
    case "eth_blockNumber":
    case "eth_getBalance":
    case "eth_getStorageAt":
    case "eth_getTransactionCount":
    case "eth_call":
    case "eth_estimateGas":
    case "eth_getFilterLogs":
    case "eth_getLogs":
    case "test_blockCache":
      return CacheStrategy.Block;

    // never cache
    default:
      return CacheStrategy.Never;
  }
}

function canCache(method: string): boolean {
  return cacheTypeForMethod(method) !== CacheStrategy.Never;
}

function paramsWithoutBlockTag(request: JRPCRequest<Json>): Json {
  if (!request.params) {
    return [];
  }
  const index: number | undefined = blockTagParamIndex(request.method);

  // Block tag param not passed.
  if (index === undefined || !Array.isArray(request.params) || index >= request.params.length) {
    return request.params;
  }

  // eth_getBlockByNumber has the block tag first, then the optional includeTx? param
  if (request.method === "eth_getBlockByNumber") {
    return request.params.slice(1);
  }
  return request.params.slice(0, index);
}

export function cacheIdentifierForRequest(request: JRPCRequest<Json>, skipBlockRef?: boolean): string | null {
  const simpleParams = skipBlockRef ? paramsWithoutBlockTag(request) : request.params ?? [];
  if (canCache(request.method)) {
    return `${request.method}:${stringify(simpleParams)}`;
  }
  return null;
}
