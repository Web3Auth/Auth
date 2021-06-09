import { sign } from "@toruslabs/tweetnacl-js";

import { getED25519Key } from "../index";

describe("ED25519 Signing", () => {
  it("#should create a tweetnacl compatible key", async () => {
    const hex = "464482ca33a3bbc47278deab1f5b896a28d36fa509b65cde837f871f3253c5ba";
    const key = getED25519Key(hex);
    const kp = sign.keyPair.fromSecretKey(key.sk);
    const sig = sign.detached(Buffer.from("message"), kp.secretKey);
    // console.log(kp.publicKey);
    sign.detached.verify(Buffer.from("message"), sig, kp.publicKey);
    const kp2 = sign.keyPair();
    const sig2 = sign.detached(Buffer.from("message"), kp2.secretKey);
    sign.detached.verify(Buffer.from("message"), sig2, kp2.publicKey);
  });
});
