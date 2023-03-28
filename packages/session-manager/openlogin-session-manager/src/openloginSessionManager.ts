import { BaseSessionManager } from "@toruslabs/base-session-manager";
import { getPublic, sign } from "@toruslabs/eccrypto";
import { decryptData, encryptData, keccak256 } from "@toruslabs/metadata-helpers";

import { OpenloginSessionManagerOptions, SessionApiResponse, SessionRequestBody } from "./interfaces";

const DEFAULT_SESSION_TIMEOUT = 86400;
export class OpenloginSessionManager<T> extends BaseSessionManager<T> {
  sessionServerBaseUrl = "https://broadcast-server.tor.us";

  sessionNamespace: string;

  sessionTime: number = DEFAULT_SESSION_TIMEOUT;

  constructor({ sessionServerBaseUrl, sessionNamespace, sessionTime }: OpenloginSessionManagerOptions) {
    super();

    if (sessionServerBaseUrl) {
      this.sessionServerBaseUrl = sessionServerBaseUrl;
    }
    if (sessionNamespace) this.sessionNamespace = sessionNamespace;
    if (sessionTime) this.sessionTime = sessionTime;
  }

  async createSession(sessionId: string, data: T): Promise<boolean> {
    super.checkSessionParams(sessionId);
    const privKey = Buffer.from(sessionId.padStart(64, "0"), "hex");
    const pubKey = getPublic(privKey).toString("hex");
    const encData = await encryptData(sessionId.padStart(64, "0"), data);
    const signature = (await sign(privKey, keccak256(encData))).toString("hex");

    const body: SessionRequestBody = {
      key: pubKey,
      data: encData,
      signature,
      namespace: this.sessionNamespace,
      timeout: this.sessionTime,
    };

    await super.request({ method: "POST", url: `${this.sessionServerBaseUrl}/store/set`, data: body });

    return true;
  }

  async authorizeSession(sessionId: string): Promise<T> {
    super.checkSessionParams(sessionId);
    const pubkey = getPublic(Buffer.from(sessionId.padStart(64, "0"), "hex")).toString("hex");
    const url = new URL(`${this.sessionServerBaseUrl}/store/get`);
    url.searchParams.append("key", pubkey);
    if (this.sessionNamespace) url.searchParams.append("namespace", this.sessionNamespace);

    const result = await super.request<SessionApiResponse>({ url: url.toString() });
    if (!result.message) {
      throw new Error("Session Expired or Invalid public key");
    }

    const response = await decryptData<T & { error?: string }>(sessionId, result.message);
    if (response.error) {
      // TODO: write why it failed.
      throw new Error("There was an error decrypting data.");
    }

    return response;
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    super.checkSessionParams(sessionId);
    const privKey = Buffer.from(sessionId.padStart(64, "0"), "hex");
    const pubKey = getPublic(privKey).toString("hex");
    const encData = await encryptData(sessionId.padStart(64, "0"), {});
    const signature = (await sign(privKey, keccak256(encData))).toString("hex");

    const data: SessionRequestBody = {
      key: pubKey,
      data: encData,
      signature,
      namespace: this.sessionNamespace,
      timeout: 1,
    };

    await super.request({ method: "POST", url: `${this.sessionServerBaseUrl}/store/set`, data });

    return true;
  }
}
