import { BaseSessionManager } from "@toruslabs/base-session-manager";
import { getPublic, sign } from "@toruslabs/eccrypto";
import { decryptData, encryptData, keccak256 } from "@toruslabs/metadata-helpers";

import { InvalidSessionData, OpenloginAuthorizeSessionResponse, OpenloginSessionManagerOptions, SessionApiResponse, SessionData } from "./interfaces";

export class OpenloginSessionManager extends BaseSessionManager<OpenloginAuthorizeSessionResponse> {
  sessionServerBaseUrl = "https://broadcast-server.tor.us";

  sessionNamespace: string;

  constructor({ sessionServerBaseUrl, sessionNamespace }: OpenloginSessionManagerOptions) {
    super();

    if (sessionServerBaseUrl) {
      this.sessionServerBaseUrl = sessionServerBaseUrl;
    }
    if (sessionNamespace) this.sessionNamespace = sessionNamespace;
  }

  async authorizeSession(sessionId: string): Promise<OpenloginAuthorizeSessionResponse> {
    super.checkSessionParams(sessionId);
    const pubkey = getPublic(Buffer.from(sessionId.padStart(64, "0"), "hex")).toString("hex");
    const url = new URL(`${this.sessionServerBaseUrl}/store/get`);
    url.searchParams.append("key", pubkey);
    if (this.sessionNamespace) url.searchParams.append("namespace", this.sessionNamespace);

    const result = await super.request<SessionApiResponse>({ url: url.toString() });
    if (!result.message) {
      throw new Error("Session Expired or Invalid public key");
    }

    const response = await decryptData<SessionData>(sessionId, result.message);
    if (response.error) {
      // TODO: write why it failed.
      throw new Error("There was an error decrypting data.");
    }

    return {
      privKey: response.privKey,
      coreKitKey: response.coreKitKey,
      ed25519PrivKey: response.ed25519PrivKey,
      coreKitEd25519PrivKey: response.coreKitEd25519PrivKey,
      sessionId: response.sessionId,
      userInfo: response.store,
    };
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    super.checkSessionParams(sessionId);
    const privKey = Buffer.from(sessionId.padStart(64, "0"), "hex");
    const pubKey = getPublic(privKey).toString("hex");
    const encData = await encryptData(sessionId.padStart(64, "0"), {});
    const signature = (await sign(privKey, keccak256(encData))).toString("hex");

    const data: InvalidSessionData = {
      key: pubKey,
      data: encData,
      signature,
      namespace: this.sessionNamespace,
    };

    await super.request({ method: "POST", url: `${this.sessionServerBaseUrl}/store/set`, data });

    return true;
  }
}
