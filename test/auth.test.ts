import { AUTH_CONNECTION, UX_MODE } from "@toruslabs/customauth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Auth } from "../src/core/auth";
import { AUTH_ACTIONS, AuthRequestPayload, BUILD_ENV, LoginParams, SDK_MODE, WEB3AUTH_NETWORK } from "../src/utils";

type AuthInternals = {
  storeAuthPayload: (loginId: string, payload: AuthRequestPayload, timeout?: number, skipAwait?: boolean) => Promise<void>;
};

describe("Auth.manageMFA", () => {
  let auth: Auth;
  let storedPayload: AuthRequestPayload | undefined;

  const manageMFA = async (params: Partial<LoginParams> = {}) => {
    await auth.manageMFA(params);
    expect(storedPayload).toBeDefined();
    return storedPayload as AuthRequestPayload;
  };

  beforeEach(() => {
    storedPayload = undefined;
    vi.stubGlobal("window", {
      location: {
        origin: "https://app.example",
        pathname: "/settings/security",
      },
      open: vi.fn(),
    });

    auth = new Auth({
      clientId: "synthetic-sdk-client-id",
      network: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
      buildEnv: BUILD_ENV.TESTING,
    });
    auth.state = {
      sessionId: "synthetic-session-id",
      userInfo: {
        authConnection: AUTH_CONNECTION.CUSTOM,
        authConnectionId: "synthetic-auth-connection-id",
        groupedAuthConnectionId: "synthetic-grouped-auth-connection-id",
        userId: "synthetic-user-id",
        isMfaEnabled: true,
      },
    };

    vi.spyOn(auth, "refreshSession").mockResolvedValue();
    vi.spyOn(auth, "getAccessToken").mockResolvedValue("synthetic-access-token");
    vi.spyOn(auth as unknown as AuthInternals, "storeAuthPayload").mockImplementation(async (_loginId, payload) => {
      storedPayload = payload;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("preserves custom JWT credentials in extraLoginOptions", async () => {
    const payload = await manageMFA({
      extraLoginOptions: {
        client_id: "synthetic-custom-client-id",
        id_token: "synthetic-custom-id-token",
      },
    });

    expect(payload.params.extraLoginOptions).toEqual({
      client_id: "synthetic-custom-client-id",
      id_token: "synthetic-custom-id-token",
      login_hint: "synthetic-user-id",
    });
  });

  it("uses the authenticated user's login_hint instead of a caller-provided value", async () => {
    const payload = await manageMFA({
      extraLoginOptions: {
        login_hint: "synthetic-caller-user-id",
      },
    });

    expect(payload.params.extraLoginOptions?.login_hint).toBe("synthetic-user-id");
  });

  it("supports omitted extraLoginOptions", async () => {
    const payload = await manageMFA();

    expect(payload.params.extraLoginOptions).toEqual({
      login_hint: "synthetic-user-id",
    });
  });

  it("retains the existing manage MFA payload fields", async () => {
    const payload = await manageMFA({
      dappUrl: "https://app.example/custom-return",
      loginSource: "synthetic-settings-page",
    });

    expect(payload).toEqual({
      actionType: AUTH_ACTIONS.MANAGE_MFA,
      options: {
        ...auth.options,
        uxMode: UX_MODE.REDIRECT,
        sdkMode: SDK_MODE.DEFAULT,
        redirectUrl: `${auth.options.dashboardUrl}/wallet/account`,
      },
      params: {
        dappUrl: "https://app.example/custom-return",
        loginSource: "synthetic-settings-page",
        authConnection: AUTH_CONNECTION.CUSTOM,
        authConnectionId: "synthetic-auth-connection-id",
        groupedAuthConnectionId: "synthetic-grouped-auth-connection-id",
        extraLoginOptions: {
          login_hint: "synthetic-user-id",
        },
        appState: expect.any(String),
      },
      sessionId: "synthetic-session-id",
      accessToken: "synthetic-access-token",
    });
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining("/start#b64Params="), "_blank");
  });
});
