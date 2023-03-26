import { get, patch, post, put } from "@toruslabs/http-helpers";

import { ApiRequestParams, ISessionManager } from "./interfaces";

export abstract class BaseSessionManager<TSessionData> implements ISessionManager<TSessionData> {
  checkSessionParams(key: string) {
    if (!key) throw new Error("Session key is required");
  }

  /**
   * Common handler method for making an http request.
   *
   * Note: Embed all the query parameters in the path itself.
   */
  protected request<T>({ method = "GET", url, data = {}, headers = {} }: ApiRequestParams): Promise<T> {
    const options = { headers };

    switch (method) {
      case "GET":
        return get<T>(url, options);
      case "POST":
        return post<T>(url, data, options);
      case "PUT":
        return put<T>(url, data, options);
      case "PATCH":
        return patch<T>(url, data, options);
    }

    throw new Error("Invalid method type");
  }

  abstract createSession(key: string, data: TSessionData): Promise<boolean>;

  abstract authorizeSession(key: string): Promise<TSessionData>;

  abstract invalidateSession(key: string): Promise<boolean>;
}
