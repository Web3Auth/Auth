import { safeatob } from "../utils";
import { log } from "../utils/logger";

// don't use destructuring for process.env cause it messes up webpack env plugin
export const version = process.env.AUTH_VERSION;

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
