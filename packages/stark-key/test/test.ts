/* eslint-disable no-console */
import { ec as starkEc } from "@toruslabs/starkware-crypto";
import { strictEqual } from "assert";
import hash from "hash.js";

import { getStarkHDAccount, getStarkKeyPair } from "../src/utils";
const openloginPrivKey = "464482ca33a3bbc47278deab1f5b896a28d36fa509b65cde837f871f3253c5ba";

describe("stark key", function () {
  it("#signing should be done using derived stark key", async function () {
    // to derive hd account
    const account = getStarkHDAccount(openloginPrivKey, "starkex", "openlogin", 0);
    const keyPair = starkEc.keyFromPrivate(account.privKey);
    const testMessage = "test message";
    const testMessageHash = hash.sha256().update(testMessage).digest("hex");
    const signedMesssage = keyPair.sign(testMessageHash);
    const isVerified = keyPair.verify(testMessageHash, signedMesssage);
    strictEqual(true, isVerified, "signed message should be verified with hd account");

    // non hd key pair
    const kp2 = getStarkKeyPair(openloginPrivKey);
    const keyPair2 = starkEc.keyFromPrivate(kp2.privKey);
    const signedMesssage2 = keyPair2.sign(testMessageHash);
    const isVerified2 = keyPair2.verify(testMessageHash, signedMesssage2);
    strictEqual(true, isVerified2, "signed message should be verified with non hd account");
  });
});
