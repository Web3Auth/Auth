import bowser from "bowser";

import { LOGIN_PROVIDER, safeatob } from "../utils";
import { loglevel as log } from "../utils/logger";

// don't use destructuring for process.env cause it messes up webpack env plugin
export const version = process.env.AUTH_VERSION;

export type HashQueryParamResult = {
  sessionId?: string;
  sessionNamespace?: string;
  error?: string;
  state?: string;
};

export function getHashQueryParams(replaceUrl = false): HashQueryParamResult {
  const result: HashQueryParamResult = {};

  const queryUrlParams = new URLSearchParams(window.location.search.slice(1));
  queryUrlParams.forEach((value: string, key: string) => {
    if (key !== "b64Params") {
      result[key as keyof HashQueryParamResult] = value;
    }
  });
  const queryResult = queryUrlParams.get("b64Params");
  if (queryResult) {
    try {
      const queryParams = JSON.parse(safeatob(queryResult));
      Object.keys(queryParams).forEach((key: string) => {
        result[key as keyof HashQueryParamResult] = queryParams[key];
      });
    } catch (error) {
      log.error(error);
    }
  }

  const hashUrlParams = new URLSearchParams(window.location.hash.substring(1));
  hashUrlParams.forEach((value: string, key: string) => {
    if (key !== "b64Params") {
      result[key as keyof HashQueryParamResult] = value;
    }
  });

  const hashResult = hashUrlParams.get("b64Params");
  if (hashResult) {
    try {
      const hashParams = JSON.parse(safeatob(hashResult));
      Object.keys(hashParams).forEach((key: string) => {
        result[key as keyof HashQueryParamResult] = hashParams[key];
      });
    } catch (error) {
      log.error(error);
    }
  }

  if (replaceUrl) {
    const cleanUrl = new URL(window.location.origin + window.location.pathname);
    // https://dapp.com/#b64Params=asacsdnvdfv&state=sldjvndfkjvn&dappValue=sdjvndf
    // NB: `params.size !== 0` evaluates to true even if `.size` isn't implemented and returns `undefined`, like in Safari <17 and Chrome <113.
    if (queryUrlParams.size !== 0) {
      queryUrlParams.delete("error");
      queryUrlParams.delete("state");
      queryUrlParams.delete("b64Params");
      queryUrlParams.delete("sessionNamespace");
      cleanUrl.search = queryUrlParams.toString();
    }
    if (hashUrlParams.size !== 0) {
      hashUrlParams.delete("error");
      hashUrlParams.delete("state");
      hashUrlParams.delete("b64Params");
      hashUrlParams.delete("sessionNamespace");
      cleanUrl.hash = hashUrlParams.toString();
    }
    window.history.replaceState({ ...window.history.state, as: cleanUrl.href, url: cleanUrl.href }, "", cleanUrl.href);
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
  if (typeof window === "undefined") return "";
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

export function isMobileOrTablet(): boolean {
  if (typeof window === "undefined") return false;
  const browser = bowser.getParser(window.navigator.userAgent);
  const platform = browser.getPlatform();
  return platform.type === bowser.PLATFORMS_MAP.tablet || platform.type === bowser.PLATFORMS_MAP.mobile;
}

export function getTimeout(loginProvider: string) {
  if ((loginProvider === LOGIN_PROVIDER.FACEBOOK || loginProvider === LOGIN_PROVIDER.LINE) && isMobileOrTablet()) {
    return 1000 * 60 * 5; // 5 minutes to finish the login
  }
  return 1000 * 10; // 10 seconds
}
