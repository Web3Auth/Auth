import { privateToAddress } from "@ethereumjs/util";
import { getKeyPairFromPath } from "@toruslabs/starkware-crypto";
import { entropyToMnemonic } from "bip39";
import type { ec as EllipticCurve } from "elliptic";
import { binaryToNumber, hexToBinary } from "enc-utils";

export const STARKNET_NETWORKS = {
  mainnet: "mainnet",
  testnet: "testnet",
};

const STARKNET_NETWORK_ID_MAP = {
  [STARKNET_NETWORKS.mainnet]: 0,
  [STARKNET_NETWORKS.testnet]: 100001,
};

export type STARTNET_NETWORK_TYPE = (typeof STARKNET_NETWORKS)[keyof typeof STARKNET_NETWORKS];
function isHexPrefixed(str: string): boolean {
  return (str || "").substring(0, 2) === "0x";
}

/*
 Returns an integer from a given section of bits out of a hex string.
 hex is the target hex string to slice.
 start represents the index of the first bit to cut from the hex string (binary) in LSB order.
 end represents the index of the last bit to cut from the hex string.
*/
function getIntFromBits(hex: string, start?: number, end?: number): number {
  const bin = hexToBinary(hex);
  const bits = bin.slice(start, end);
  const int = binaryToNumber(bits);
  return int;
}

/**
 * param- privKey secp256k1 private key in hex format
 * param- accountIndex accountIndex represents an index of the possible associated wallets derived from the seed.
 * param- starknetType corresponding startnet network (refer to STARKNET_NETWORKS type for possible values)
 * returns Calculates the stark key pair based on the STARTNET_NETWORK_TYPE and a given index.
 */
export function getStarkHDAccount(privKey: string, accountIndex: number, starknetType: STARTNET_NETWORK_TYPE): EllipticCurve.KeyPair {
  if (!STARKNET_NETWORK_ID_MAP[starknetType]) {
    throw new Error(`Invalid starknet network specified:- ${starknetType}`);
  }
  const privKeyBuffer = Buffer.from(privKey, "hex");
  if (privKeyBuffer.length !== 32) {
    throw new Error("Invalid privKey size");
  }
  const ethAddress = privateToAddress(privKeyBuffer).toString("hex");
  const sanitizedEthAddr = isHexPrefixed(ethAddress) ? ethAddress : `0x${ethAddress}`;
  const mnemonic = entropyToMnemonic(privKey);
  const application = STARKNET_NETWORK_ID_MAP[starknetType];

  // Draws the 31 LSBs of the eth address.
  const ethAddressInt1 = getIntFromBits(sanitizedEthAddr, -31);
  // Draws the following 31 LSBs of the eth address.
  const ethAddressInt2 = getIntFromBits(sanitizedEthAddr, -62, -31);
  const accountPath = `m/2645'/1195502025'/${application}'/${ethAddressInt1}'/${ethAddressInt2}'/${accountIndex}`;
  const keyPair = getKeyPairFromPath(mnemonic, accountPath);
  return keyPair;
}
