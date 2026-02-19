import { describe, expect, it } from "vitest";

import { rpcErrors } from "../../src";
import { createScaffoldMiddleware } from "../../src/jrpc/v2/createScaffoldMiddleware";
import { JRPCEngineV2 } from "../../src/jrpc/v2/jrpcEngineV2";
import type { MiddlewareScaffold } from "../../src/jrpc/v2/v2interfaces";
import { makeRequest } from "../utils";

describe("createScaffoldMiddleware", () => {
  it("basic middleware test", async () => {
    const scaffold: MiddlewareScaffold = {
      method1: "foo",
      method2: () => 42,
      method3: () => {
        throw rpcErrors.internal({ message: "method3" });
      },
    };

    const engine = JRPCEngineV2.create({
      middleware: [createScaffoldMiddleware(scaffold), (): string => "passthrough"],
    });

    const result1 = await engine.handle(makeRequest({ method: "method1" }));
    const result2 = await engine.handle(makeRequest({ method: "method2" }));
    const promise3 = engine.handle(makeRequest({ method: "method3" }));
    const result4 = await engine.handle(makeRequest({ method: "unknown" }));

    expect(result1).toBe("foo");

    expect(result2).toBe(42);

    await expect(promise3).rejects.toThrow(rpcErrors.internal({ message: "method3" }));

    expect(result4).toBe("passthrough");
  });
});
