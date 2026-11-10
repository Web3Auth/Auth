import { describe, expect, it } from "vitest";

import { parseRedirectLoginParams } from "../utils";

describe("parseRedirectLoginParams", () => {
  it("accepts login params that name an auth connection", () => {
    expect(parseRedirectLoginParams(JSON.stringify({ authConnection: "google", appState: "return-here" }))).toEqual({
      authConnection: "google",
      appState: "return-here",
    });
  });

  it("accepts a grouped auth connection", () => {
    expect(parseRedirectLoginParams(JSON.stringify({ authConnectionId: "connection", groupedAuthConnectionId: "group" }))).toEqual({
      authConnectionId: "connection",
      groupedAuthConnectionId: "group",
    });
  });

  it("ignores missing, invalid, and connection-less params", () => {
    expect(parseRedirectLoginParams(undefined)).toBeUndefined();
    expect(parseRedirectLoginParams("")).toBeUndefined();
    expect(parseRedirectLoginParams("not-json")).toBeUndefined();
    expect(parseRedirectLoginParams("null")).toBeUndefined();
    expect(parseRedirectLoginParams("[]")).toBeUndefined();
    expect(parseRedirectLoginParams(JSON.stringify({ appState: "x" }))).toBeUndefined();
    expect(parseRedirectLoginParams(JSON.stringify({ authConnection: "" }))).toBeUndefined();
    expect(parseRedirectLoginParams(JSON.stringify({ authConnectionId: "connection" }))).toBeUndefined();
  });
});
