import { add0x, bytesToNumberBE, hexToBigInt, mod, secp256k1 } from "@toruslabs/metadata-helpers";

import { mimcHash } from "./mimcsponge";

export function subkey(keyHex: string, input: Uint8Array): string {
  const privKeyBuf = hexToBigInt(add0x(keyHex)).toString(10);
  const curveN = secp256k1.Point.CURVE().n;
  const inputPath = mod(bytesToNumberBE(input), curveN).toString(10);

  const output = mimcHash(1, privKeyBuf, inputPath);
  return output.xL.toString(16);
}
