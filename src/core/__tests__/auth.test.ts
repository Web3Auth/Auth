import { describe, expect, it } from "vitest";

import { Auth } from "../auth";
import {
  AUTH_SERVICE_PRODUCTION_URL,
  AUTH_SERVICE_STAGING_URL,
  BUILD_ENV,
  type AuthOptions,
  WEB3AUTH_NETWORK,
} from "../../utils";

const createAuth = (options: Pick<AuthOptions, "buildEnv" | "sdkUrl">): Auth =>
  new Auth({
    clientId: "test-client-id",
    network: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    ...options,
  });

describe("Auth sdkUrl environment policy", () => {
  it("ignores a custom sdkUrl in production", () => {
    const auth = createAuth({
      buildEnv: BUILD_ENV.PRODUCTION,
      sdkUrl: "https://attacker.example",
    });

    expect(auth.baseUrl).toBe(AUTH_SERVICE_PRODUCTION_URL);
    expect(auth.options.sdkUrl).toBe(AUTH_SERVICE_PRODUCTION_URL);
  });

  it("ignores a custom sdkUrl in staging", () => {
    const auth = createAuth({
      buildEnv: BUILD_ENV.STAGING,
      sdkUrl: "https://attacker.example",
    });

    expect(auth.baseUrl).toBe(AUTH_SERVICE_STAGING_URL);
    expect(auth.options.sdkUrl).toBe(AUTH_SERVICE_STAGING_URL);
  });

});
