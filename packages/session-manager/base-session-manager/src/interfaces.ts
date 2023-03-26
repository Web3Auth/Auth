export type IRequestBody = Record<string, unknown>;

export interface ApiRequestParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: IRequestBody;
}

export interface ISessionManager<TSessionData> {
  createSession(key: string, data: TSessionData): Promise<boolean>;
  authorizeSession(key: string): Promise<TSessionData>;
  invalidateSession(key: string): Promise<boolean>;
}
