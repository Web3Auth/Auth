import { ec, grindKey, pedersen, sign, verify } from "@toruslabs/starkware-crypto";

export const starkEc = ec;
export const starkGrindKey = grindKey;
export const starkPedersen = pedersen;
export const starkSign = sign;
export const starkVerify = verify;

export * from "./utils";
