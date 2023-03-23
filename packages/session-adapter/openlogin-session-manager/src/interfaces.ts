import { IRequestBody } from "@toruslabs/base-session-manager";

export type SessionApiResponse = {
  message?: string;
};

export interface OpenloginSessionManagerOptions {
  sessionServerBaseUrl?: string;
  sessionNamespace?: string;
}

export interface BaseSessionData {
  privKey?: string;
  coreKitKey?: string;
  ed25519PrivKey?: string;
  coreKitEd25519PrivKey?: string;
  sessionId?: string;
  store?: Record<string, string>;
}

export interface SessionData extends BaseSessionData {
  store?: Record<string, string>;
  error?: string;
}

// TODO: to define user info here.
export interface OpenloginAuthorizeSessionResponse extends BaseSessionData {
  userInfo?: Record<string, string>;
}

export interface InvalidSessionData extends IRequestBody {
  key: string;
  data: string;
  signature: string;
  timeout?: number;
  namespace?: string;
}
