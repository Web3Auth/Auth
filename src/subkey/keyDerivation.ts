import { mod } from "@noble/curves/abstract/modular.js";
import { bytesToNumberBE } from "@noble/curves/utils.js";
import { secp256k1 } from "@toruslabs/metadata-helpers";

import { mimcHash } from "./mimcsponge";

export function subkey(keyHex: string, input: Uint8Array): string {
  const hexPrefixedKey = keyHex.startsWith("0x") ? keyHex : `0x${keyHex}`;
  const privKeyBuf = BigInt(hexPrefixedKey).toString(10);
  const curveN = secp256k1.Point.CURVE().n;
  const inputPath = mod(bytesToNumberBE(input), curveN).toString(10);

  const output = mimcHash(1, privKeyBuf, inputPath);
  return output.xL.toString(16);
}
