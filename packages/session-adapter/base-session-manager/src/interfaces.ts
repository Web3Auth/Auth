export type IRequestBody = Record<string, unknown>;

export interface ApiRequestParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: IRequestBody;
}

export interface ISessionManager<TSessionResponse> {
  authorizeSession(key: string): Promise<TSessionResponse>;
  invalidateSession(key: string): Promise<boolean>;
}
