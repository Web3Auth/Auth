import { getPublic, sign } from "@toruslabs/eccrypto";
import { base64url } from "@toruslabs/openlogin-jrpc";

export async function documentReady(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (document.readyState !== "loading") {
      resolve();
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        resolve();
      });
    }
  });
}

export const htmlToElement = (html: string): Node => {
  const template = window.document.createElement("template");
  const trimmedHtml = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = trimmedHtml;
  return template.content.firstChild;
};

export async function whitelistUrl(clientId: string, appKey: string, origin: string): Promise<string> {
  const appKeyBuf = Buffer.from(appKey.padStart(64, "0"), "hex");
  if (base64url.encode(getPublic(appKeyBuf)) !== clientId) throw new Error("appKey mismatch");
  const sig = await sign(appKeyBuf, Buffer.from(origin, "utf-8"));
  return base64url.encode(sig);
}

export function getHashQueryParams(replaceUrl = false): Record<string, string> {
  const result = {};

  const url = new URL(window.location.href);
  url.searchParams.forEach((value, key) => {
    if (key !== "result") {
      result[key] = value;
    }
  });
  const queryResult = url.searchParams.get("result");
  if (queryResult) {
    try {
      const queryParams = JSON.parse(atob(queryResult));
      Object.keys(queryParams).forEach((key) => {
        result[key] = queryParams[key];
      });
    } catch (error) {
      window.console.error(error);
    }
  }

  const hash = url.hash.substr(1);
  const hashUrl = new URL(`${window.location.origin}/?${hash}`);
  hashUrl.searchParams.forEach((value, key) => {
    if (key !== "result") {
      result[key] = value;
    }
  });
  const hashResult = hashUrl.searchParams.get("result");

  if (hashResult) {
    try {
      const hashParams = JSON.parse(atob(hashResult));
      Object.keys(hashParams).forEach((key) => {
        result[key] = hashParams[key];
      });
    } catch (error) {
      window.console.error(error);
    }
  }

  if (replaceUrl) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState(null, "", cleanUrl);
  }

  return result;
}

type PopupResponse<T> = {
  pid: string;
  data: T;
};

export async function awaitReq<T>(id: string): Promise<T> {
  return new Promise((resolve) => {
    const handler = (ev: MessageEvent<PopupResponse<T>>) => {
      const { pid } = ev.data;
      if (id !== pid) return;
      window.removeEventListener("message", handler);
      resolve(ev.data.data);
    };
    window.addEventListener("message", handler);
  });
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

export type Maybe<T> = Partial<T> | null | undefined;
