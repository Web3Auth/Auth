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
    if (key !== "result") {
      result[key] = value;
    }
  });
  const queryResult = url.searchParams.get("result");
  if (queryResult) {
    try {
      const queryParams = JSON.parse(atob(queryResult));
      Object.keys(queryParams).forEach((value, key) => {
        result[key] = value;
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
      Object.keys(hashParams).forEach((value, key) => {
        result[key] = value;
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
