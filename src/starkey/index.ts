import { ec, grindKey, pedersen, sign, verify } from "@toruslabs/starkware-crypto";

const starkEc = ec;

export { grindKey, pedersen, sign, starkEc, verify };

export * from "./utils";
