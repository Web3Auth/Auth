export type IRequestBody = Record<string, unknown>;

export interface ApiRequestParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: IRequestBody;
}

export interface ISessionManager<TSessionData> {
  sessionKey: string;
  createSession(data: TSessionData): Promise<string>;
  authorizeSession(): Promise<TSessionData>;
  invalidateSession(): Promise<boolean>;
}
