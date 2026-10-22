import { describe, expect, it } from "vitest";

import { Auth } from "../auth";
import { version } from "../utils";
import {
  AUTH_DASHBOARD_DEVELOPMENT_URL,
  AUTH_DASHBOARD_PRODUCTION_URL,
  AUTH_DASHBOARD_STAGING_URL,
  AUTH_DASHBOARD_TESTING_URL,
  AUTH_SERVICE_DEVELOPMENT_URL,
  AUTH_SERVICE_PRODUCTION_URL,
  AUTH_SERVICE_STAGING_URL,
  AUTH_SERVICE_TESTING_URL,
  BUILD_ENV,
  type AuthOptions,
  WEB3AUTH_NETWORK,
} from "../../utils";

const createAuth = (options: Pick<AuthOptions, "buildEnv" | "sdkUrl" | "dashboardUrl"> = {}): Auth =>
  new Auth({
    clientId: "test-client-id",
    network: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    ...options,
  });

const versioned = (url: string): string => `${url}/v${version.split(".")[0]}`;

const dashboardUrlOf = (auth: Auth): string => (auth as unknown as { dashboardUrl: string }).dashboardUrl;

describe("Auth sdkUrl environment policy", () => {
  it("ignores a custom sdkUrl in production", () => {
    const auth = createAuth({
      buildEnv: BUILD_ENV.PRODUCTION,
      sdkUrl: "https://attacker.example",
      dashboardUrl: "https://attacker.example",
    });

    expect(auth.options.sdkUrl).toBe(AUTH_SERVICE_PRODUCTION_URL);
    expect(auth.options.dashboardUrl).toBe(AUTH_DASHBOARD_PRODUCTION_URL);
    expect(auth.baseUrl).toBe(AUTH_SERVICE_PRODUCTION_URL);
    expect(dashboardUrlOf(auth)).toBe(AUTH_DASHBOARD_PRODUCTION_URL);
  });

  it("ignores a custom sdkUrl in staging", () => {
    const auth = createAuth({
      buildEnv: BUILD_ENV.STAGING,
      sdkUrl: "https://attacker.example",
      dashboardUrl: "https://attacker.example",
    });

    expect(auth.options.sdkUrl).toBe(AUTH_SERVICE_STAGING_URL);
    expect(auth.options.dashboardUrl).toBe(AUTH_DASHBOARD_STAGING_URL);
    expect(auth.baseUrl).toBe(AUTH_SERVICE_STAGING_URL);
    expect(dashboardUrlOf(auth)).toBe(AUTH_DASHBOARD_STAGING_URL);
  });

  it("versions the default production and staging hosts", () => {
    const production = createAuth();
    expect(production.options.sdkUrl).toBe(AUTH_SERVICE_PRODUCTION_URL);
    expect(production.baseUrl).toBe(versioned(AUTH_SERVICE_PRODUCTION_URL));
    expect(dashboardUrlOf(production)).toBe(versioned(AUTH_DASHBOARD_PRODUCTION_URL));

    const staging = createAuth({ buildEnv: BUILD_ENV.STAGING });
    expect(staging.baseUrl).toBe(versioned(AUTH_SERVICE_STAGING_URL));
    expect(dashboardUrlOf(staging)).toBe(versioned(AUTH_DASHBOARD_STAGING_URL));
  });

  it("leaves development and testing hosts unversioned", () => {
    const development = createAuth({ buildEnv: BUILD_ENV.DEVELOPMENT });
    expect(development.options.sdkUrl).toBe(AUTH_SERVICE_DEVELOPMENT_URL);
    expect(development.baseUrl).toBe(AUTH_SERVICE_DEVELOPMENT_URL);
    expect(dashboardUrlOf(development)).toBe(AUTH_DASHBOARD_DEVELOPMENT_URL);

    const customDevelopment = createAuth({
      buildEnv: BUILD_ENV.DEVELOPMENT,
      sdkUrl: "http://localhost:4000",
      dashboardUrl: "http://localhost:5174",
    });
    expect(customDevelopment.options.sdkUrl).toBe("http://localhost:4000");
    expect(customDevelopment.baseUrl).toBe("http://localhost:4000");
    expect(dashboardUrlOf(customDevelopment)).toBe("http://localhost:5174");

    const testing = createAuth({ buildEnv: BUILD_ENV.TESTING });
    expect(testing.options.sdkUrl).toBe(AUTH_SERVICE_TESTING_URL);
    expect(testing.baseUrl).toBe(AUTH_SERVICE_TESTING_URL);
    expect(dashboardUrlOf(testing)).toBe(AUTH_DASHBOARD_TESTING_URL);
  });
});
