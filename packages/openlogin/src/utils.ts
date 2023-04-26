/* eslint-disable @typescript-eslint/no-var-requires */
import { getPublic, sign } from "@toruslabs/eccrypto";
import { keccak256 } from "@toruslabs/metadata-helpers";
import { base64url, OpenloginSessionData, safeatob } from "@toruslabs/openlogin-utils";

import log from "./loglevel";

const pkg = require("../package.json");

export async function whitelistUrl(clientId: string, appKey: string, origin: string): Promise<string> {
  const appKeyBuf = Buffer.from(appKey.padStart(64, "0"), "hex");
  if (base64url.encode(getPublic(appKeyBuf)) !== clientId) throw new Error("appKey mismatch");
  const sig = await sign(appKeyBuf, keccak256(origin));
  return base64url.encode(sig);
}

export function getHashQueryParams(replaceUrl = false): Pick<OpenloginSessionData, "sessionId"> {
  const result: Pick<OpenloginSessionData, "sessionId"> = {};

  const url = new URL(window.location.href);
  url.searchParams.forEach((value, key) => {
    if (key !== "result") {
      result[key] = value;
    }
  });
  const queryResult = url.searchParams.get("result");
  if (queryResult) {
    try {
      const queryParams = JSON.parse(safeatob(queryResult));
      Object.keys(queryParams).forEach((key) => {
        result[key] = queryParams[key];
      });
    } catch (error) {
      log.error(error);
    }
  }

  const hash = url.hash.substring(1);
  const hashUrl = new URL(`${window.location.origin}/?${hash}`);
  hashUrl.searchParams.forEach((value, key) => {
    if (key !== "result") {
      result[key] = value;
    }
  });
  const hashResult = hashUrl.searchParams.get("result");

  if (hashResult) {
    try {
      const hashParams = JSON.parse(safeatob(hashResult));
      Object.keys(hashParams).forEach((key) => {
        result[key] = hashParams[key];
      });
    } catch (error) {
      log.error(error);
    }
  }

  if (replaceUrl) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState(null, "", cleanUrl);
  }

  return result;
}

export function constructURL(params: { baseURL: string; query?: Record<string, unknown>; hash?: Record<string, unknown> }): string {
  const { baseURL, query, hash } = params;

  const url = new URL(baseURL);
  if (query) {
    Object.keys(query).forEach((key) => {
      url.searchParams.append(key, query[key] as string);
    });
  }
  if (hash) {
    const h = new URL(constructURL({ baseURL, query: hash })).searchParams.toString();
    url.hash = h;
  }
  return url.toString();
}

export function getPopupFeatures(): string {
  // Fixes dual-screen position                             Most browsers      Firefox
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

  const w = 1200;
  const h = 700;

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
    ? document.documentElement.clientWidth
    : window.screen.width;

  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
    ? document.documentElement.clientHeight
    : window.screen.height;

  const systemZoom = 1; // No reliable estimate

  const left = Math.abs((width - w) / 2 / systemZoom + dualScreenLeft);
  const top = Math.abs((height - h) / 2 / systemZoom + dualScreenTop);
  const features = `titlebar=0,toolbar=0,status=0,location=0,menubar=0,height=${h / systemZoom},width=${w / systemZoom},top=${top},left=${left}`;
  return features;
}

export const { version } = pkg;
