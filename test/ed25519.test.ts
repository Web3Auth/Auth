import { sign } from "@toruslabs/tweetnacl-js";
import { describe, expect, it } from "vitest";

import { getED25519Key } from "../src/ed25519";

const hex = "464482ca33a3bbc47278deab1f5b896a28d36fa509b65cde837f871f3253c5ba";

describe("ED25519", () => {
  // let privKey: { sk: Buffer; pk: Buffer };

  // before("setup", function () {
  // });

  it("should create a tweetnacl compatible key", async () => {
    const privKey = getED25519Key(hex);
    const kp = sign.keyPair.fromSecretKey(privKey.sk);
    const sig = sign.detached(Buffer.from("message"), kp.secretKey);

    expect(sign.detached.verify(Buffer.from("message"), sig, kp.publicKey)).toBe(true);

    const kp2 = sign.keyPair();
    const sig2 = sign.detached(Buffer.from("message"), kp2.secretKey);
    expect(sign.detached.verify(Buffer.from("message"), sig2, kp2.publicKey)).toBe(true);
  });

  // it("#encrypting should create a tweetnacl compatible key", async function () {
  //   const kp = box.keyPair.fromSecretKey(privKey.sk);
  //   const kp2 = box.keyPair();

  //   const msg = Buffer.from("message");
  //   const nonce = randomBytes(32);
  //   // encrypting for the second user
  //   const encrypted = box(msg, nonce, kp2.publicKey, kp.secretKey);
  //   const returnedMsg = box.open(encrypted, nonce, kp.publicKey, kp2.secretKey);

  //   strictEqual(msg.equals(returnedMsg), true, "messages should be identical");
  // });
});
