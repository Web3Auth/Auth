import { IRequestBody } from "@toruslabs/base-session-manager";

export type SessionApiResponse = {
  message?: string;
};

export interface OpenloginSessionManagerOptions {
  sessionServerBaseUrl?: string;
  sessionNamespace?: string;
  sessionTime?: number;
  sessionId?: string;
}

export interface SessionRequestBody extends IRequestBody {
  key: string;
  data: string;
  signature: string;
  timeout?: number;
  namespace?: string;
}
