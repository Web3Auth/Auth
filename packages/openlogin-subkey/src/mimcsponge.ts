/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { Scalar, ZqField } from "@toruslabs/ffjavascript";
import { keccak256 } from "@toruslabs/metadata-helpers";
import BN from "bn.js";

const F = new ZqField(Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617"));

const SEED = "mimcsponge";
const NROUNDS = 220;

function keccak256Padded(str: string): string {
  let finalInput: Buffer = Buffer.from(str, "utf8");
  if (typeof str === "string" && str.slice(0, 2) === "0x" && str.length === 66) {
    finalInput = Buffer.from(str.slice(2), "hex");
  }
  return `0x${keccak256(finalInput).toString("hex").padStart(64, "0")}`;
}

export function mimgGetIV(seed: string): bigint {
  let _seed = seed;
  if (typeof _seed === "undefined") _seed = SEED;
  const c = keccak256Padded(`${_seed}_iv`);
  const cn = Scalar.fromString(new BN(c, 16).toString());
  const iv = cn.mod(F.p);
  return iv;
}

export function mimcGetConstants(seed?: string, nRounds?: number): bigint[] {
  let _seed = seed;
  let _nRounds = nRounds;
  if (typeof _seed === "undefined") _seed = SEED;
  if (typeof nRounds === "undefined") _nRounds = NROUNDS;
  const cts = new Array(_nRounds);
  let c = keccak256Padded(SEED);
  for (let i = 1; i < _nRounds; i += 1) {
    c = keccak256Padded(c);

    const n1 = new BN(c.slice(2), 16).mod(new BN(F.p.toString()));
    const c2 = n1.toString(16, 64);
    cts[i] = F.e(new BN(c2, 16).toString());
  }
  cts[0] = F.e(0);
  cts[cts.length - 1] = F.e(0);
  return cts;
}

const cts = mimcGetConstants(SEED, NROUNDS);

export function mimcHash(
  _xL_in: any,
  _xR_in: any,
  _k: any
): {
  xL: bigint;
  xR: bigint;
} {
  let xL = F.e(_xL_in);
  let xR = F.e(_xR_in);
  const k = F.e(_k);
  for (let i = 0; i < NROUNDS; i += 1) {
    const c = cts[i];
    const t = i === 0 ? F.add(xL, k) : F.add(F.add(xL, k), c);
    const xR_tmp = F.e(xR);
    if (i < NROUNDS - 1) {
      xR = xL;
      xL = F.add(xR_tmp, F.pow(t, 5));
    } else {
      xR = F.add(xR_tmp, F.pow(t, 5));
    }
  }
  return {
    xL: F.normalize(xL),
    xR: F.normalize(xR),
  };
}

export function mimcMultiHash(arr: any[], key: any, numOutputs: number): bigint[] {
  let _key = key;
  let _numOutputs = numOutputs;
  if (typeof _numOutputs === "undefined") {
    _numOutputs = 1;
  }
  if (typeof _key === "undefined") {
    _key = F.zero;
  }

  let R = F.zero;
  let C = F.zero;

  for (let i = 0; i < arr.length; i += 1) {
    R = F.add(R, F.e(arr[i]));
    const S = mimcHash(R, C, _key);
    R = S.xL;
    C = S.xR;
  }
  const outputs = [R];
  for (let i = 1; i < _numOutputs; i += 1) {
    const S = mimcHash(R, C, _key);
    R = S.xL;
    C = S.xR;
    outputs.push(R);
  }
  if (_numOutputs === 1) {
    return F.normalize(outputs[0]);
  }
  return outputs.map((x) => F.normalize(x));
}
