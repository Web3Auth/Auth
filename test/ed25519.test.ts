import { getEd25519, hexToBytes } from "@toruslabs/metadata-helpers";
import nacl from "@toruslabs/tweetnacl-js";
import { describe, expect, it } from "vitest";

import { getED25519Key } from "../src/ed25519";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const l = (nacl as any).lowlevel;

function getED25519KeyOld(privateKey: string | Uint8Array): {
  sk: Uint8Array;
  pk: Uint8Array;
} {
  let privKey: Uint8Array;
  if (typeof privateKey === "string") {
    privKey = hexToBytes(privateKey);
  } else {
    privKey = privateKey;
  }

  const d = new Uint8Array(64);
  const p = [l.gf(), l.gf(), l.gf(), l.gf()];
  const sk = new Uint8Array([...new Uint8Array(privKey), ...new Uint8Array(32)]);
  const pk = new Uint8Array(32);
  l.crypto_hash(d, sk, 32);

  d[0] &= 248;
  d[31] &= 127;
  d[31] |= 64;
  l.scalarbase(p, d);
  l.pack(pk, p);
  for (let i = 0; i < 32; i += 1) sk[i + 32] = pk[i];

  return { sk, pk };
}

const testVectors: { seed: string; pk: string }[] = [
  {
    seed: "464482ca33a3bbc47278deab1f5b896a28d36fa509b65cde837f871f3253c5ba",
    pk: "97b10866da3175028e6677899c7dd8dcaf56dcbc388d81f4b75aca4442d4ef4d",
  },
  {
    seed: "0000000000000000000000000000000000000000000000000000000000000001",
    pk: "4cb5abf6ad79fbf5abbccafcc269d85cd2651ed4b885b5869f241aedf0a5ba29",
  },
  {
    seed: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    pk: "76a1592044a6e4f511265bca73a604d90b0529d1df602be30a19a9257660d1f5",
  },
  {
    seed: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    pk: "5cceaad9c202c236cd8c977290a844e3f2f0a15a9b3189220dbe0f9121eb0cd2",
  },
  {
    seed: "a3c7e0194e73b6e06b3e8b7e3f3d6e1cb78f5d90c2d5a1fbb4e0c7d2e9a8f6b1",
    pk: "5596a67619bda5dd11fa3f0531653efdd978626f0352b0638597e06c42500b91",
  },
  {
    seed: "0000000000000000000000000000000000000000000000000000000000000000",
    pk: "3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29",
  },
  {
    seed: "7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f",
    pk: "b2a942ff4c98718bed76e255987f6d59b1a72d3b2cd2510003e6170ac63a9ffb",
  },
  {
    seed: "8080808080808080808080808080808080808080808080808080808080808080",
    pk: "e5687b6d11ccfb632abbafe844f8f1693d160aa582156ed66eea38ab5e7d1e12",
  },
  {
    seed: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    pk: "ff57575dc7af8bfc4d0837cc1ce2017b686a88145dc5579a958e3462fe9a908e",
  },
  {
    seed: "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    pk: "105854d9eda8fff1d194653512f276d97edf1ec50f4b10bb3606f8cc13836846",
  },
];

const signingTestVector = {
  seed: "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
  pk: "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
  signature: "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
};

describe("ED25519", () => {
  it("should return 64-byte sk with seed prefix and 32-byte pk suffix", () => {
    const { sk, pk } = getED25519Key(testVectors[0].seed);
    const seed = hexToBytes(testVectors[0].seed);

    expect(sk).toHaveLength(64);
    expect(pk).toHaveLength(32);
    expect(sk.slice(0, 32)).toEqual(seed);
    expect(sk.slice(32)).toEqual(pk);
  });

  it("should accept Uint8Array input", () => {
    const seed = hexToBytes(testVectors[0].seed);
    const fromHex = getED25519Key(testVectors[0].seed);
    const fromBytes = getED25519Key(seed);

    expect(fromBytes.pk).toEqual(fromHex.pk);
    expect(fromBytes.sk).toEqual(fromHex.sk);
  });

  it("should derive deterministic keys", () => {
    const a = getED25519Key(testVectors[0].seed);
    const b = getED25519Key(testVectors[0].seed);

    expect(a.pk).toEqual(b.pk);
    expect(a.sk).toEqual(b.sk);
  });
});

describe("getED25519Key constant output", () => {
  it.each(testVectors)("should derive expected pk from seed $seed", ({ seed, pk: expectedPk }) => {
    const { pk } = getED25519Key(seed);
    expect(pk).toEqual(hexToBytes(expectedPk));
  });

  it.each(testVectors)("should produce sk = seed || pk for seed $seed", ({ seed, pk: expectedPk }) => {
    const { sk } = getED25519Key(seed);
    const expectedSk = new Uint8Array(64);
    expectedSk.set(hexToBytes(seed), 0);
    expectedSk.set(hexToBytes(expectedPk), 32);
    expect(sk).toEqual(expectedSk);
  });

  it("should produce different keys for different seeds", () => {
    const results = testVectors.map((v) => getED25519Key(v.seed));
    const uniquePks = new Set(results.map((r) => Buffer.from(r.pk).toString("hex")));
    expect(uniquePks.size).toBe(testVectors.length);
  });
});

describe("getED25519Key vs getED25519KeyOld", () => {
  it.each(testVectors)("should produce identical pk and sk for seed $seed", ({ seed }) => {
    const newResult = getED25519Key(seed);
    const oldResult = getED25519KeyOld(seed);

    expect(newResult.pk).toEqual(oldResult.pk);
    expect(newResult.sk).toEqual(oldResult.sk);
  });

  it.each(testVectors)("should produce identical output from Uint8Array input for seed $seed", ({ seed }) => {
    const seedBytes = hexToBytes(seed);
    const newResult = getED25519Key(seedBytes);
    const oldResult = getED25519KeyOld(seedBytes);

    expect(newResult.pk).toEqual(oldResult.pk);
    expect(newResult.sk).toEqual(oldResult.sk);
  });

  it("should match for a randomly generated 32-byte seed", () => {
    const seed = globalThis.crypto.getRandomValues(new Uint8Array(32));
    const newResult = getED25519Key(seed);
    const oldResult = getED25519KeyOld(seed);

    expect(newResult.pk).toEqual(oldResult.pk);
    expect(newResult.sk).toEqual(oldResult.sk);
  });
});

describe("getED25519Key signing", () => {
  it("should sign and verify the RFC 8032 empty-message test vector", () => {
    const message = new Uint8Array(0);
    const { sk, pk } = getED25519Key(signingTestVector.seed);
    const signature = nacl.sign.detached(message, sk);

    expect(pk).toEqual(hexToBytes(signingTestVector.pk));
    expect(signature).toEqual(hexToBytes(signingTestVector.signature));
    expect(nacl.sign.detached.verify(message, signature, pk)).toBe(true);

    const nobleEd25519 = getEd25519();
    const nobleCompatibleKey = sk.slice(0, 32);
    const nobleSig = nobleEd25519.sign(message, nobleCompatibleKey);
    expect(nobleSig).toEqual(signature);
    expect(nobleEd25519.verify(nobleSig, message, pk)).toBe(true);
  });
});
