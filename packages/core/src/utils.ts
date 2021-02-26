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

export function getHashQueryParams(replaceUrl = false): Record<string, string> {
  const result = {};

  const url = new URL(window.location.href);
  url.searchParams.forEach((value, key) => {
    result[key] = value;
  });

  const hash = url.hash.substr(1);
  const hashUrl = new URL(`${window.location.origin}/?${hash}`);
  hashUrl.searchParams.forEach((value, key) => {
    result[key] = value;
  });

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

export async function awaitReq<T>(popupId: string): Promise<T> {
  return new Promise((resolve) => {
    const handler = (ev: MessageEvent<PopupResponse<T>>) => {
      const { pid } = ev.data;
      if (popupId !== pid) return;
      window.removeEventListener("message", handler);
      resolve(ev.data.data);
    };
    window.addEventListener("message", handler);
  });
}

export function constructURL(baseURL: string, queryParams: Record<string, unknown>, hashParams?: Record<string, unknown>): string {
  const url = new URL(baseURL);
  Object.keys(queryParams).forEach((key) => {
    url.searchParams.append(key, queryParams[key] as string);
  });
  if (hashParams) {
    const hash = new URL(constructURL(baseURL, hashParams)).searchParams.toString();
    url.hash = hash;
  }
  return url.toString();
}

export type Maybe<T> = Partial<T> | null | undefined;
