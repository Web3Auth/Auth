import { getEd25519, hexToBytes } from "@toruslabs/metadata-helpers";

export type SECP256K1KeyType = "secp256k1";
export type ED25519KeyType = "ed25519";

export type SECP256K1Key = Uint8Array;
export type ED25519Key = Uint8Array;

const ed25519 = getEd25519();

export function getED25519Key(privateKey: string | Uint8Array): {
  sk: Uint8Array;
  pk: Uint8Array;
} {
  const privKey = typeof privateKey === "string" ? hexToBytes(privateKey) : privateKey;
  const { secretKey, publicKey } = ed25519.keygen(privKey);
  return { sk: secretKey, pk: publicKey };
}
