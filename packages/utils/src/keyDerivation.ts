import BN from "bn.js";

import { mimcHash } from "./mimcsponge";

// creates subkeys via MiMC hash, output keys are not padded
export function subkey(keyHex: string, input: Buffer): string {
  const privKeyBuf = Buffer.from(new BN(keyHex, "hex").toString(16, 64), "hex");
  // TODO: check against existing usage of mimc
  // TODO: check that MPC is possible with mimc, with tests
  const output = mimcHash(1, privKeyBuf, input);
  return output.xL.toString(16);
}
