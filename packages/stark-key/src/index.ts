import { ec, pedersen, sign, verify } from "@toruslabs/starkware-crypto";

const starkEc = ec;

export { pedersen, sign, starkEc, verify };

export * from "./utils";
