import { ec as starkEc } from "@toruslabs/starkware-crypto";
import { strictEqual } from "assert";
import hash from "hash.js";

import { getStarkHDAccount } from "../src/utils";
const openloginPrivKey = "464482ca33a3bbc47278deab1f5b896a28d36fa509b65cde837f871f3253c5ba";

describe("stark key", function () {
  it("#signing should be done using derived stark key", async function () {
    // to derive hd account
    const account = getStarkHDAccount(openloginPrivKey, "starkex", "openlogin", 10);
    const keyPair = starkEc.keyFromPrivate(account.privKey);
    const testMessage = "test message";
    const testMessageHash = hash.sha256().update(testMessage).digest("hex");
    const signedMesssage = keyPair.sign(testMessageHash);
    const isVerified = keyPair.verify(testMessageHash, signedMesssage.toDER());
    strictEqual(true, isVerified, "signed message should be verified with hd account");
  });
});
