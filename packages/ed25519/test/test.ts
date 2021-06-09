import { sign } from "@toruslabs/tweetnacl-js";
import { strictEqual } from "assert";

import { getED25519Key } from "../index";

const hex = "464482ca33a3bbc47278deab1f5b896a28d36fa509b65cde837f871f3253c5ba";

describe("ED25519", function () {
  // let privKey: { sk: Buffer; pk: Buffer };

  // before("setup", function () {
  // });

  it("#signing should create a tweetnacl compatible key", async function () {
    const privKey = getED25519Key(hex);
    const kp = sign.keyPair.fromSecretKey(privKey.sk);
    const sig = sign.detached(Buffer.from("message"), kp.secretKey);
    strictEqual(sign.detached.verify(Buffer.from("message"), sig, kp.publicKey), true, "Signature could not be verified");
    const kp2 = sign.keyPair();
    const sig2 = sign.detached(Buffer.from("message"), kp2.secretKey);
    strictEqual(sign.detached.verify(Buffer.from("message"), sig2, kp2.publicKey), true, "Signature is not equal for default");
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
