import { utf8ToBytes } from "@toruslabs/metadata-helpers";
import { sign } from "@toruslabs/tweetnacl-js";
import { describe, expect, it } from "vitest";

import { getED25519Key } from "../src/ed25519";

const hex = "464482ca33a3bbc47278deab1f5b896a28d36fa509b65cde837f871f3253c5ba";

describe("ED25519", () => {
  it("should create a tweetnacl compatible key", async () => {
    const privKey = getED25519Key(hex);
    const kp = sign.keyPair.fromSecretKey(privKey.sk);
    const sig = sign.detached(utf8ToBytes("message"), kp.secretKey);

    expect(sign.detached.verify(utf8ToBytes("message"), sig, kp.publicKey)).toBe(true);

    const kp2 = sign.keyPair();
    const sig2 = sign.detached(utf8ToBytes("message"), kp2.secretKey);
    expect(sign.detached.verify(utf8ToBytes("message"), sig2, kp2.publicKey)).toBe(true);
  });
});
