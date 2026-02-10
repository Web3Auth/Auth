import { describe, expect, it, vi } from "vitest";

import { JRPCEngine, JRPCFailure, JRPCRequest, JRPCSuccess, Json } from "../../src";
import { asLegacyMiddleware } from "../../src/jrpc/v2/asLegacyMiddleware";
import { JsonRpcEngineV2 } from "../../src/jrpc/v2/JsonRpcEngineV2";
import type { JsonRpcMiddlewareV2, ResultConstraint } from "../../src/jrpc/v2/v2interfaces";
import { getExtraneousKeys, makeRequest, makeRequestMiddleware } from "../utils";

describe("asLegacyMiddleware", () => {
  it("converts a v2 engine to a legacy middleware", () => {
    const engine = JsonRpcEngineV2.create({
      middleware: [makeRequestMiddleware()],
    });
    const middleware = asLegacyMiddleware(engine);
    expect(typeof middleware).toBe("function");
  });

  it("forwards a result to the legacy engine", async () => {
    const v2Engine = JsonRpcEngineV2.create({
      middleware: [makeRequestMiddleware()],
    });

    const legacyEngine = new JRPCEngine();
    legacyEngine.push(asLegacyMiddleware(v2Engine));

    const response = (await legacyEngine.handle(makeRequest())) as JRPCSuccess<unknown>;

    expect(response.result).toBeNull();
  });

  it("forwarded results are not frozen", async () => {
    const v2Middleware: JsonRpcMiddlewareV2<JRPCRequest> = () => [];
    const v2Engine = JsonRpcEngineV2.create({
      middleware: [v2Middleware],
    });

    const legacyEngine = new JRPCEngine();
    legacyEngine.push(asLegacyMiddleware(v2Engine));

    const response = (await legacyEngine.handle(makeRequest())) as JRPCSuccess<unknown>;

    expect(response.result).toStrictEqual([]);
    expect(Object.isFrozen(response.result)).toBe(false);
  });

  it("forwards an error to the legacy engine", async () => {
    const v2Middleware: JsonRpcMiddlewareV2<JRPCRequest> = () => {
      throw new Error("test");
    };
    const v2Engine = JsonRpcEngineV2.create({
      middleware: [v2Middleware],
    });

    const legacyEngine = new JRPCEngine();
    legacyEngine.push(asLegacyMiddleware(v2Engine));

    const response = (await legacyEngine.handle(makeRequest())) as JRPCFailure;

    expect(response.error).toStrictEqual({
      message: "test",
      code: -32603,
      data: {
        cause: {
          message: "test",
          stack: expect.any(String),
        },
      },
      stack: expect.any(String),
    });
  });

  it("allows the legacy engine to continue when not ending the request", async () => {
    const v2Middleware: JsonRpcMiddlewareV2<JRPCRequest> = vi.fn(({ next }) => next());
    const v2Engine = JsonRpcEngineV2.create({
      middleware: [v2Middleware],
    });

    const legacyEngine = new JRPCEngine();
    legacyEngine.push(asLegacyMiddleware(v2Engine));
    legacyEngine.push((_req, res, _next, end) => {
      res.result = null;
      end();
    });

    const response = (await legacyEngine.handle(makeRequest())) as JRPCSuccess<unknown>;
    expect(response.result).toBeNull();
    expect(v2Middleware).toHaveBeenCalledTimes(1);
  });

  it("allows the legacy engine to continue when not ending the request (passing through the original request)", async () => {
    const v2Middleware: JsonRpcMiddlewareV2<JRPCRequest> = vi.fn(({ request, next }) => next(request));
    const v2Engine = JsonRpcEngineV2.create({
      middleware: [v2Middleware],
    });

    const legacyEngine = new JRPCEngine();
    legacyEngine.push(asLegacyMiddleware(v2Engine));
    legacyEngine.push((_req, res, _next, end) => {
      res.result = null;
      end();
    });

    const response = (await legacyEngine.handle(makeRequest())) as JRPCSuccess<unknown>;
    expect(response.result).toBeNull();
    expect(v2Middleware).toHaveBeenCalledTimes(1);
  });

  it("propagates request modifications to the legacy engine", async () => {
    const v2Engine = JsonRpcEngineV2.create<JsonRpcMiddlewareV2<JRPCRequest>>({
      middleware: [({ request, next }): Promise<Readonly<Json> | undefined> => next({ ...request, method: "test_request_2" })],
    });

    const legacyEngine = new JRPCEngine();
    legacyEngine.push((req, _res, next, _end) => {
      expect(req.method).toBe("test_request");
      next();
    });
    legacyEngine.push(asLegacyMiddleware(v2Engine));
    legacyEngine.push((req, res, _next, end) => {
      expect(req.method).toBe("test_request_2");
      res.result = null;
      end();
    });

    const response = (await legacyEngine.handle(makeRequest())) as JRPCSuccess<unknown>;
    expect(response.result).toBeNull();
  });

  it("propagates additional request properties to the v2 context and back", async () => {
    const observedContextValues: number[] = [];

    const v2Middleware = vi.fn((({ context, next }): Promise<Readonly<Json> | undefined> => {
      observedContextValues.push(context.assertGet("value") as number);

      expect(Array.from(context.keys())).toStrictEqual(["value"]);

      context.set("newValue", 2);
      return next();
    }) satisfies JsonRpcMiddlewareV2<JRPCRequest, ResultConstraint<JRPCRequest>>);

    const v2Engine = JsonRpcEngineV2.create({
      middleware: [v2Middleware],
    });

    const legacyEngine = new JRPCEngine();
    legacyEngine.push((req, _res, next, _end) => {
      (req as unknown as Record<string, unknown>).value = 1;
      return next();
    });
    legacyEngine.push(asLegacyMiddleware(v2Engine));
    legacyEngine.push((req, res, _next, end) => {
      const request = req as unknown as Record<string, unknown>;
      observedContextValues.push(request.newValue as number);

      expect(getExtraneousKeys(request)).toStrictEqual(["value", "newValue"]);

      res.result = null;
      end();
    });

    await legacyEngine.handle(makeRequest());
    expect(observedContextValues).toStrictEqual([1, 2]);
  });

  describe("with V2 middleware", () => {
    it("accepts a single V2 middleware", async () => {
      const v2Middleware: JsonRpcMiddlewareV2<JRPCRequest> = vi.fn(() => "test-result");

      const legacyEngine = new JRPCEngine();
      legacyEngine.push(asLegacyMiddleware(v2Middleware));

      const response = (await legacyEngine.handle(makeRequest())) as JRPCSuccess<unknown>;

      expect(response.result).toBe("test-result");
      expect(v2Middleware).toHaveBeenCalledTimes(1);
    });

    it("accepts multiple V2 middlewares via rest params", async () => {
      const middleware1: JsonRpcMiddlewareV2<JRPCRequest> = vi.fn(({ context, next }) => {
        context.set("visited1", true);
        return next();
      });

      const middleware2: JsonRpcMiddlewareV2<JRPCRequest> = vi.fn(({ context }) => {
        expect(context.get("visited1")).toBe(true);
        return "composed-result";
      });

      const legacyEngine = new JRPCEngine();
      legacyEngine.push(asLegacyMiddleware(middleware1, middleware2));

      const response = (await legacyEngine.handle(makeRequest())) as JRPCSuccess<unknown>;

      expect(response.result).toBe("composed-result");
      expect(middleware1).toHaveBeenCalledTimes(1);
      expect(middleware2).toHaveBeenCalledTimes(1);
    });

    it("forwards errors from V2 middleware", async () => {
      const v2Middleware: JsonRpcMiddlewareV2<JRPCRequest> = vi.fn(() => {
        throw new Error("v2-error");
      });

      const legacyEngine = new JRPCEngine();
      legacyEngine.push(asLegacyMiddleware(v2Middleware));

      const response = (await legacyEngine.handle(makeRequest())) as JRPCFailure;

      expect(response.error).toStrictEqual({
        message: "v2-error",
        code: -32603,
        data: {
          cause: {
            message: "v2-error",
            stack: expect.any(String),
          },
        },
        stack: expect.any(String),
      });
    });

    it("allows legacy engine to continue when V2 middleware does not end", async () => {
      const v2Middleware: JsonRpcMiddlewareV2<JRPCRequest> = vi.fn(({ next }) => next());

      const legacyEngine = new JRPCEngine();
      legacyEngine.push(asLegacyMiddleware(v2Middleware));
      legacyEngine.push((_req, res, _next, end) => {
        res.result = "continued";
        end();
      });

      const response = (await legacyEngine.handle(makeRequest())) as JRPCSuccess<unknown>;

      expect(response.result).toBe("continued");
      expect(v2Middleware).toHaveBeenCalledTimes(1);
    });
  });
});
