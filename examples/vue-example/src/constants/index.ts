import { ec as EllipticCurve } from "elliptic";

export const DELIMITERS = {
  Delimiter1: "\u001c",
  Delimiter2: "\u0015",
  Delimiter3: "\u0016",
  Delimiter4: "\u0017",
};

export const CURVE = new EllipticCurve("secp256k1");
