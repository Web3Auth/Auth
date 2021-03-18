import BN from "bn.js";

import { mimcHash } from "./mimcsponge";

export const SECP256K1_CURVE_N = "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141";

// creates subkeys via MiMC hash, output keys are not padded
export function subkey(keyHex: string, input: Buffer): string {
  const privKeyBuf = Buffer.from(new BN(keyHex, "hex").toString(16, 64), "hex");
  // TODO: check against existing usage of mimc
  // TODO: check that MPC is possible with mimc, with tests
  const inputPath = new BN(input).umod(new BN(SECP256K1_CURVE_N, "hex"));

  const output = mimcHash(1, privKeyBuf, inputPath);
  return output.xL.toString(16);
}
