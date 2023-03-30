import { BaseSessionManager } from "@toruslabs/base-session-manager";
import { generatePrivate, getPublic, sign } from "@toruslabs/eccrypto";
import { decryptData, encryptData, keccak256 } from "@toruslabs/metadata-helpers";

import { OpenloginSessionManagerOptions, SessionApiResponse, SessionRequestBody } from "./interfaces";

const DEFAULT_SESSION_TIMEOUT = 86400;
export class OpenloginSessionManager<T> extends BaseSessionManager<T> {
  sessionServerBaseUrl = "https://broadcast-server.tor.us";

  sessionNamespace: string;

  sessionTime: number = DEFAULT_SESSION_TIMEOUT;

  private sessionId: string;

  constructor({ sessionServerBaseUrl, sessionNamespace, sessionTime, sessionId }: OpenloginSessionManagerOptions) {
    super();

    if (sessionServerBaseUrl) {
      this.sessionServerBaseUrl = sessionServerBaseUrl;
    }
    if (sessionNamespace) this.sessionNamespace = sessionNamespace;
    if (sessionTime) this.sessionTime = sessionTime;
    if (sessionId) this.sessionKey = sessionId;
  }

  get sessionKey(): string {
    return this.sessionId?.padStart(64, "0") || "";
  }

  set sessionKey(value: string) {
    this.sessionId = value;
  }

  static generateRandomSessionKey(): string {
    return generatePrivate().toString("hex").padStart(64, "0");
  }

  async createSession(data: T): Promise<string> {
    const privKey = Buffer.from(this.sessionKey, "hex");
    const pubKey = getPublic(privKey).toString("hex");
    const encData = await encryptData(this.sessionKey, data);
    const signature = (await sign(privKey, keccak256(encData))).toString("hex");

    const body: SessionRequestBody = {
      key: pubKey,
      data: encData,
      signature,
      namespace: this.sessionNamespace,
      timeout: this.sessionTime,
    };

    await super.request({ method: "POST", url: `${this.sessionServerBaseUrl}/store/set`, data: body });

    return this.sessionKey;
  }

  async authorizeSession(): Promise<T> {
    super.checkSessionParams(this.sessionKey);
    const pubkey = getPublic(Buffer.from(this.sessionKey, "hex")).toString("hex");
    const url = new URL(`${this.sessionServerBaseUrl}/store/get`);
    url.searchParams.append("key", pubkey);
    if (this.sessionNamespace) url.searchParams.append("namespace", this.sessionNamespace);

    const result = await super.request<SessionApiResponse>({ url: url.toString() });
    if (!result.message) {
      throw new Error("Session Expired or Invalid public key");
    }

    const response = await decryptData<T & { error?: string }>(this.sessionKey, result.message);
    if (response.error) {
      throw new Error("There was an error decrypting data.");
    }

    return response;
  }

  async invalidateSession(): Promise<boolean> {
    super.checkSessionParams(this.sessionKey);
    const privKey = Buffer.from(this.sessionKey, "hex");
    const pubKey = getPublic(privKey).toString("hex");
    const encData = await encryptData(this.sessionKey, {});
    const signature = (await sign(privKey, keccak256(encData))).toString("hex");

    const data: SessionRequestBody = {
      key: pubKey,
      data: encData,
      signature,
      namespace: this.sessionNamespace,
      timeout: 1,
    };

    await super.request({ method: "POST", url: `${this.sessionServerBaseUrl}/store/set`, data });
    this.sessionKey = "";
    return true;
  }
}
