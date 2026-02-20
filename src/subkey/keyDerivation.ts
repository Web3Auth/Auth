import { bytesToHex } from "@toruslabs/metadata-helpers";

import { mimcHash } from "./mimcsponge";

export const SECP256K1_CURVE_N = "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141";

function uint8ArrayToBigInt(bytes: Uint8Array): bigint {
  return BigInt(`0x${bytesToHex(bytes)}`);
}

function unsignedMod(a: bigint, b: bigint): bigint {
  return ((a % b) + b) % b;
}

export function subkey(keyHex: string, input: Uint8Array): string {
  const privKeyBuf = BigInt(`0x${keyHex}`).toString(10);
  const curveN = BigInt(`0x${SECP256K1_CURVE_N}`);
  const inputPath = unsignedMod(uint8ArrayToBigInt(input), curveN).toString(10);

  const output = mimcHash(1, privKeyBuf, inputPath);
  return output.xL.toString(16);
}
