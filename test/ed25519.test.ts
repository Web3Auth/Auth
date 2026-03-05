import { hexToBytes } from "@toruslabs/metadata-helpers";
import { describe, expect, it } from "vitest";

import { getED25519Key } from "../src/ed25519";

const hex = "464482ca33a3bbc47278deab1f5b896a28d36fa509b65cde837f871f3253c5ba";

describe("ED25519", () => {
  it("should return 64-byte sk with seed prefix and 32-byte pk suffix", () => {
    const { sk, pk } = getED25519Key(hex);
    const seed = hexToBytes(hex);

    expect(sk).toHaveLength(64);
    expect(pk).toHaveLength(32);
    expect(sk.slice(0, 32)).toEqual(seed);
    expect(sk.slice(32)).toEqual(pk);
  });

  it("should accept Uint8Array input", () => {
    const seed = hexToBytes(hex);
    const fromHex = getED25519Key(hex);
    const fromBytes = getED25519Key(seed);

    expect(fromBytes.pk).toEqual(fromHex.pk);
    expect(fromBytes.sk).toEqual(fromHex.sk);
  });

  it("should derive deterministic keys", () => {
    const a = getED25519Key(hex);
    const b = getED25519Key(hex);

    expect(a.pk).toEqual(b.pk);
    expect(a.sk).toEqual(b.sk);
  });
});
