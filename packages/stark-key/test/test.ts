import { ec as starkEc, pedersen, sign, verify } from "@toruslabs/starkware-crypto";
import { strictEqual } from "assert";

// import hash from "hash.js";
import { getStarkHDAccount } from "../src/utils";
const openloginPrivKey = "464482ca33a3bbc47278deab1f5b896a28d36fa509b65cde837f871f3253c5ba";

describe("stark key", function () {
  it("#signing should be done using derived stark key", async function () {
    // to derive hd account
    const account = getStarkHDAccount(openloginPrivKey, 1);
    const keyPair = starkEc.keyFromPrivate(account.privKey);
    const testMessageHash = pedersen([
      "58f580910a6ca59b28927c08fe6c43e2e303ca384badc365795fc645d479d45",
      "78734f65a067be9bdb39de18434d71e79f7b6466a4b66bbd979ab9e7515fe0b",
    ]);
    strictEqual("68cc0b76cddd1dd4ed2301ada9b7c872b23875d5ff837b3a87993e0d9996b87", testMessageHash, "incorrect pedersen hash");
    const signedMesssage = sign(keyPair, testMessageHash);
    const isVerified = verify(keyPair, testMessageHash, signedMesssage);
    strictEqual(true, isVerified, "signed message should be verified with hd account");
  });
});
