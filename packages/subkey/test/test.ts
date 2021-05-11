import { deepStrictEqual } from "assert";

import { subkey } from "../index";

const PRIVATE_KEY = "f70fb5f5970b363879bc36f54d4fc0ad77863bfd059881159251f50f48863acc";
const clientId = "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs";

describe("Sub Key Derivation", () => {
  it("#should derive subkey correctly", async () => {
    const privKey = PRIVATE_KEY;
    const subKeyDerived = subkey(privKey, Buffer.from(clientId, "base64"));
    deepStrictEqual(subKeyDerived, "2a152b927d3b01ffa912c68050d795ac59e1e4672506cdc73a29d50aa1933405", "derived key should be correct");
  });
});
