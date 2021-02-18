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
