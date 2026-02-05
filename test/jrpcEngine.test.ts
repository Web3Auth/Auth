import { describe, expect, it } from "vitest";

import { errorCodes } from "../src/jrpc/errors";
import { JRPCEngine } from "../src/jrpc/jrpcEngine";

describe("JRPCEngine request validation", () => {
  it("returns invalidRequest for non-object requests", async () => {
    const engine = new JRPCEngine();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await engine.handle(123 as any);
    expect(response.error?.code).toBe(errorCodes.rpc.invalidRequest);
    expect(response.id).toBeUndefined();
    expect(response.jsonrpc).toBe("2.0");
  });

  it("returns invalidRequest for non-string method", async () => {
    const engine = new JRPCEngine();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await engine.handle({ id: 1, jsonrpc: "2.0", method: 123 as any });
    expect(response.error?.code).toBe(errorCodes.rpc.invalidRequest);
    expect(response.id).toBe(1);
    expect(response.jsonrpc).toBe("2.0");
  });

  it("returns invalidRequest for empty batch requests", async () => {
    const engine = new JRPCEngine();
    const responses = await engine.handle([]);
    expect(responses).toHaveLength(1);
    expect(responses[0].error?.code).toBe(errorCodes.rpc.invalidRequest);
    expect(responses[0].id).toBeUndefined();
    expect(responses[0].jsonrpc).toBe("2.0");
  });
});
