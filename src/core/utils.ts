import { decodeBase64Url } from "@toruslabs/metadata-helpers";

import { AuthFlowError, AuthFlowResult, type LoginParams } from "../utils";
import { log } from "../utils/logger";

// The build replaces process.env.AUTH_VERSION with the package version; keep this exact expression.
export const version = process.env.AUTH_VERSION as string;

export type HashQueryParamResult = {
  sessionId?: string;
  sessionNamespace?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  error?: string;
  state?: string;
  nonce?: string;
  loginParams?: string;
};

const HASH_QUERY_PARAM_KEYS: ReadonlySet<string> = new Set<keyof HashQueryParamResult>([
  "sessionId",
  "sessionNamespace",
  "accessToken",
  "refreshToken",
  "idToken",
  "error",
  "state",
  "nonce",
  "loginParams",
]);

function isHashQueryParamKey(key: string): key is keyof HashQueryParamResult {
  return HASH_QUERY_PARAM_KEYS.has(key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

// loginParams arrives from the redirect URL. Reject anything that is not the login payload init() can resume.
export function parseRedirectLoginParams(loginParams: string | undefined): LoginParams | undefined {
  if (!loginParams) return undefined;
  try {
    const parsed: unknown = JSON.parse(loginParams);
    if (!isRecord(parsed)) return undefined;
    const hasConnection = isNonEmptyString(parsed.authConnection);
    const hasGroupedConnection = isNonEmptyString(parsed.authConnectionId) && isNonEmptyString(parsed.groupedAuthConnectionId);
    if (!hasConnection && !hasGroupedConnection) return undefined;
    return parsed as LoginParams;
  } catch (error) {
    log.error(error);
    return undefined;
  }
}

export function getHashQueryParams(replaceUrl = false): HashQueryParamResult {
  const result: HashQueryParamResult = {};

  const queryUrlParams = new URLSearchParams(window.location.search.slice(1));
  queryUrlParams.forEach((value: string, key: string) => {
    if (isHashQueryParamKey(key)) {
      result[key] = value;
    }
  });
  const queryResult = queryUrlParams.get("b64Params");
  if (queryResult) {
    try {
      const queryParams = JSON.parse(decodeBase64Url(queryResult));
      Object.keys(queryParams).forEach((key: string) => {
        if (isHashQueryParamKey(key)) result[key] = queryParams[key];
      });
    } catch (error) {
      log.error(error);
    }
  }

  const hashUrlParams = new URLSearchParams(window.location.hash.substring(1));
  hashUrlParams.forEach((value: string, key: string) => {
    if (isHashQueryParamKey(key)) {
      result[key] = value;
    }
  });

  const hashResult = hashUrlParams.get("b64Params");
  if (hashResult) {
    try {
      const hashParams = JSON.parse(decodeBase64Url(hashResult));
      Object.keys(hashParams).forEach((key: string) => {
        if (isHashQueryParamKey(key)) result[key] = hashParams[key];
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

export function isAuthFlowError(result: AuthFlowResult): result is AuthFlowError {
  return "error" in result;
}
