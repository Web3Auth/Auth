import { describe, expect, it, vi } from "vitest";

import { JRPCParams, JRPCRequest, JRPCResponse, Json } from "../../src";
import { SafeEventEmitter } from "../../src/jrpc/safeEventEmitter";
import { JRPCEngineV2 } from "../../src/jrpc/v2/jrpcEngineV2";
import { providerAsMiddleware, providerFromEngine, providerFromMiddleware } from "../../src/jrpc/v2/providerUtils";
import type { JRPCMiddlewareV2 } from "../../src/jrpc/v2/v2interfaces";
import { makeRequest, makeRequestMiddleware } from "../utils";

/**
 * Wraps `provider.send` in a promise for easier testing.
 */
function sendPromise<U>(provider: ReturnType<typeof providerFromEngine>, req: JRPCRequest): Promise<{ error: unknown; response: JRPCResponse<U> }> {
  return new Promise((resolve) => {
    provider.send<JRPCParams, U>(req, (error, response) => {
      resolve({ error, response });
    });
  });
}

describe("providerUtils", () => {
  describe("providerFromEngine", () => {
    it("returns a SafeEventEmitter instance", () => {
      const engine = JRPCEngineV2.create({ middleware: [makeRequestMiddleware()] });
      const provider = providerFromEngine(engine as JRPCEngineV2);

      expect(provider).toBeInstanceOf(SafeEventEmitter);
    });

    it("has sendAsync, send, and request methods", () => {
      const engine = JRPCEngineV2.create({ middleware: [makeRequestMiddleware()] });
      const provider = providerFromEngine(engine as JRPCEngineV2);

      expect(typeof provider.sendAsync).toBe("function");
      expect(typeof provider.send).toBe("function");
      expect(typeof provider.request).toBe("function");
    });

    describe("sendAsync", () => {
      it("returns the result from the engine", async () => {
        const engine = JRPCEngineV2.create({
          middleware: [makeRequestMiddleware()],
        });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const result = await provider.sendAsync(makeRequest());

        expect(result).toBeNull();
      });

      it("returns complex results from the engine", async () => {
        const middleware: JRPCMiddlewareV2<JRPCRequest> = () => ({ foo: "bar", nums: [1, 2, 3] });
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const result = await provider.sendAsync(makeRequest());

        expect(result).toStrictEqual({ foo: "bar", nums: [1, 2, 3] });
      });

      it("propagates errors thrown by the engine", async () => {
        const middleware: JRPCMiddlewareV2<JRPCRequest> = () => {
          throw new Error("engine error");
        };
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        await expect(provider.sendAsync(makeRequest())).rejects.toThrow("engine error");
      });

      it("works with async middleware", async () => {
        const middleware: JRPCMiddlewareV2<JRPCRequest> = async () => {
          return "async-result";
        };
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const result = await provider.sendAsync(makeRequest());

        expect(result).toBe("async-result");
      });

      it("works with a middleware chain", async () => {
        const middleware1: JRPCMiddlewareV2<JRPCRequest> = ({ context, next }) => {
          context.set("step", 1);
          return next();
        };
        const middleware2: JRPCMiddlewareV2<JRPCRequest> = ({ context }) => {
          return `step-${context.get("step")}`;
        };
        const engine = JRPCEngineV2.create({ middleware: [middleware1, middleware2] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const result = await provider.sendAsync(makeRequest());

        expect(result).toBe("step-1");
      });
    });

    describe("send", () => {
      it("throws if callback is not a function", () => {
        const engine = JRPCEngineV2.create({ middleware: [makeRequestMiddleware()] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        expect(() => {
          // @ts-expect-error - Testing invalid callback
          provider.send(makeRequest(), "not a function");
        }).toThrow('Must provide callback to "send" method.');
      });

      it("calls the callback with the result on success", async () => {
        const engine = JRPCEngineV2.create({ middleware: [makeRequestMiddleware()] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const req = makeRequest({ id: "42" });
        const { error, response } = await sendPromise(provider, req);

        expect(error).toBeNull();
        expect(response).toStrictEqual({
          id: "42",
          jsonrpc: "2.0",
          result: null,
        });
      });

      it("calls the callback with the error on failure", async () => {
        const testError = new Error("send error");
        const middleware: JRPCMiddlewareV2<JRPCRequest> = () => {
          throw testError;
        };
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const req = makeRequest({ id: "42" });
        const { error, response } = await sendPromise(provider, req);

        expect(error).toMatchObject({ code: -32603, message: "send error" });
        expect(error).toBe(response.error);
        expect(response.id).toBe("42");
        expect(response.jsonrpc).toBe("2.0");
      });

      it("constructs a proper JRPCResponse shape", async () => {
        const middleware: JRPCMiddlewareV2<JRPCRequest> = () => "hello";
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const req = makeRequest({ id: "99" });
        const { response } = await sendPromise(provider, req);

        expect(response).toHaveProperty("id", "99");
        expect(response).toHaveProperty("jsonrpc", "2.0");
        expect(response).toHaveProperty("result", "hello");
      });

      it("does not reject if the success callback throws", async () => {
        const engine = JRPCEngineV2.create({ middleware: [makeRequestMiddleware()] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const unhandled = vi.fn();
        process.on("unhandledRejection", unhandled);

        provider.send(makeRequest(), () => {
          throw new Error("callback boom");
        });
        await new Promise((resolve) => setTimeout(resolve, 50));

        process.off("unhandledRejection", unhandled);
        expect(unhandled).toHaveBeenCalledTimes(1);
      });

      it("does not reject if the error callback throws", async () => {
        const middleware: JRPCMiddlewareV2<JRPCRequest> = () => {
          throw new Error("engine error");
        };
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const unhandled = vi.fn();
        process.on("unhandledRejection", unhandled);

        provider.send(makeRequest(), () => {
          throw new Error("callback boom");
        });
        await new Promise((resolve) => setTimeout(resolve, 50));

        process.off("unhandledRejection", unhandled);
        expect(unhandled).toHaveBeenCalledTimes(1);
      });

      it.each([
        { label: "string", thrown: "string error", expectedCause: "string error" },
        { label: "null", thrown: null, expectedCause: null },
        { label: "undefined", thrown: undefined, expectedCause: null },
        { label: "number", thrown: 42, expectedCause: 42 },
      ])("serializes non-Error throw ($label) via send callback", async ({ thrown, expectedCause }) => {
        const middleware: JRPCMiddlewareV2<JRPCRequest> = () => {
          throw thrown;
        };
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const { error, response } = await sendPromise(provider, makeRequest({ id: "x" }));

        expect(error).toBe(response.error);
        expect(response.id).toBe("x");
        expect(response.jsonrpc).toBe("2.0");
        const rpcError = response.error as Record<string, unknown>;
        expect(rpcError).toBeDefined();
        expect(rpcError).toHaveProperty("code");
        expect((rpcError.data as Record<string, unknown>).cause).toStrictEqual(expectedCause);
      });
    });

    describe("request", () => {
      it("returns the result", async () => {
        const engine = JRPCEngineV2.create({ middleware: [makeRequestMiddleware()] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const result = await provider.request({ method: "test_method" });

        expect(result).toBeNull();
      });

      it("constructs a JRPC request with id and jsonrpc fields", async () => {
        const observedRequests: JRPCRequest[] = [];
        const middleware: JRPCMiddlewareV2<JRPCRequest> = ({ request }) => {
          observedRequests.push(request);
          return null;
        };
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        await provider.request({ method: "test_method", params: [1, 2] });

        expect(observedRequests).toHaveLength(1);
        expect(observedRequests[0]).toMatchObject({
          method: "test_method",
          params: [1, 2],
          jsonrpc: "2.0",
        });
        expect(typeof observedRequests[0].id).toBe("number");
      });

      it("passes params through to the engine", async () => {
        const middleware: JRPCMiddlewareV2<JRPCRequest<Json>, Json> = ({ request }) => {
          return request.params;
        };
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        const result = await provider.request({ method: "echo", params: ["a", "b"] });

        expect(result).toStrictEqual(["a", "b"]);
      });

      it("propagates errors", async () => {
        const middleware: JRPCMiddlewareV2<JRPCRequest> = () => {
          throw new Error("request error");
        };
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        await expect(provider.request({ method: "fail" })).rejects.toThrow("request error");
      });

      it("generates unique ids for each request", async () => {
        const observedIds: Set<string> = new Set();
        const middleware: JRPCMiddlewareV2<JRPCRequest> = ({ request }) => {
          observedIds.add(request.id as string);
          return null;
        };
        const engine = JRPCEngineV2.create({ middleware: [middleware] });
        const provider = providerFromEngine(engine as JRPCEngineV2);

        await Promise.all(Array.from({ length: 10 }, () => provider.request({ method: "test" })));

        expect(observedIds.size).toBe(10);
      });
    });
  });

  describe("providerFromMiddleware", () => {
    it("creates a provider backed by the given middleware", async () => {
      const middleware: JRPCMiddlewareV2<JRPCRequest> = () => "middleware-result";
      const provider = providerFromMiddleware(middleware as JRPCMiddlewareV2);

      const result = await provider.sendAsync(makeRequest());

      expect(result).toBe("middleware-result");
    });

    it("returns a SafeEventEmitter instance", () => {
      const provider = providerFromMiddleware(makeRequestMiddleware() as JRPCMiddlewareV2);

      expect(provider).toBeInstanceOf(SafeEventEmitter);
    });

    it("supports request method", async () => {
      const middleware: JRPCMiddlewareV2<JRPCRequest> = ({ request }) => {
        return `echo:${request.method}`;
      };
      const provider = providerFromMiddleware(middleware as JRPCMiddlewareV2);

      const result = await provider.request({ method: "hello" });

      expect(result).toBe("echo:hello");
    });

    it("propagates middleware errors via sendAsync", async () => {
      const middleware: JRPCMiddlewareV2<JRPCRequest> = () => {
        throw new Error("middleware-error");
      };
      const provider = providerFromMiddleware(middleware as JRPCMiddlewareV2);

      await expect(provider.sendAsync(makeRequest())).rejects.toThrow("middleware-error");
    });

    it("propagates middleware errors via send callback", async () => {
      const testError = new Error("middleware-error");
      const middleware: JRPCMiddlewareV2<JRPCRequest> = () => {
        throw testError;
      };
      const provider = providerFromMiddleware(middleware as JRPCMiddlewareV2);

      const { error, response } = await sendPromise(provider, makeRequest());

      expect(error).toMatchObject({ code: -32603, message: "middleware-error" });
      expect(error).toBe(response.error);
    });

    it("works with a middleware that uses context", async () => {
      const middleware1: JRPCMiddlewareV2 = ({ context, next }) => {
        context.set("value", 42);
        return next();
      };
      const middleware2: JRPCMiddlewareV2<JRPCRequest, Json> = ({ context }) => {
        return context.get("value") as Json;
      };
      const engine = JRPCEngineV2.create({ middleware: [middleware1, middleware2] });
      const provider = providerFromEngine(engine as JRPCEngineV2);

      const result = await provider.sendAsync(makeRequest());

      expect(result).toBe(42);
    });
  });

  describe("providerAsMiddleware", () => {
    it("converts a provider into a V2 middleware", () => {
      const engine = JRPCEngineV2.create({ middleware: [makeRequestMiddleware()] });
      const provider = providerFromEngine(engine as JRPCEngineV2);

      const middleware = providerAsMiddleware(provider);

      expect(typeof middleware).toBe("function");
    });

    it("delegates requests to the provider", async () => {
      const innerMiddleware: JRPCMiddlewareV2<JRPCRequest> = () => "provider-result";
      const innerEngine = JRPCEngineV2.create({ middleware: [innerMiddleware] });
      const provider = providerFromEngine(innerEngine as JRPCEngineV2);

      const outerEngine = JRPCEngineV2.create({
        middleware: [providerAsMiddleware(provider)],
      });

      const result = await outerEngine.handle(makeRequest());

      expect(result).toBe("provider-result");
    });

    it("propagates errors from the provider", async () => {
      const innerMiddleware: JRPCMiddlewareV2<JRPCRequest> = () => {
        throw new Error("inner error");
      };
      const innerEngine = JRPCEngineV2.create({ middleware: [innerMiddleware] });
      const provider = providerFromEngine(innerEngine as JRPCEngineV2);

      const outerEngine = JRPCEngineV2.create({
        middleware: [providerAsMiddleware(provider)],
      });

      await expect(outerEngine.handle(makeRequest())).rejects.toThrow("inner error");
    });

    it("can be composed in a middleware chain", async () => {
      const innerMiddleware: JRPCMiddlewareV2<JRPCRequest> = ({ request }) => {
        return `inner:${request.method}`;
      };
      const innerEngine = JRPCEngineV2.create({ middleware: [innerMiddleware] });
      const provider = providerFromEngine(innerEngine as JRPCEngineV2);

      const outerMiddleware = vi.fn(({ next }) => next());
      const outerEngine = JRPCEngineV2.create({
        middleware: [outerMiddleware, providerAsMiddleware(provider)],
      });

      const result = await outerEngine.handle(makeRequest({ method: "my_method" }));

      expect(result).toBe("inner:my_method");
      expect(outerMiddleware).toHaveBeenCalledTimes(1);
    });

    it("round-trips: engine -> provider -> middleware -> engine", async () => {
      const originalMiddleware: JRPCMiddlewareV2<JRPCRequest> = () => "round-trip";
      const engine1 = JRPCEngineV2.create({ middleware: [originalMiddleware] });
      const provider = providerFromEngine(engine1 as JRPCEngineV2);
      const wrappedMiddleware = providerAsMiddleware(provider);

      const engine2 = JRPCEngineV2.create({ middleware: [wrappedMiddleware] });

      const result = await engine2.handle(makeRequest());

      expect(result).toBe("round-trip");
    });

    it("round-trips: middleware -> provider -> middleware", async () => {
      const originalMiddleware: JRPCMiddlewareV2 = () => "full-circle";
      const provider = providerFromMiddleware(originalMiddleware);
      const wrappedMiddleware = providerAsMiddleware(provider);

      const engine = JRPCEngineV2.create({ middleware: [wrappedMiddleware] });

      const result = await engine.handle(makeRequest());

      expect(result).toBe("full-circle");
    });

    it("deep-clones the request so frozen nested params are isolated from the original", async () => {
      let receivedParams: unknown;
      const innerMiddleware: JRPCMiddlewareV2<JRPCRequest<Json>, Json> = ({ request }) => {
        receivedParams = request.params;
        return request.params;
      };
      const innerEngine = JRPCEngineV2.create({ middleware: [innerMiddleware] });
      const provider = providerFromEngine(innerEngine as JRPCEngineV2);

      const outerEngine = JRPCEngineV2.create({
        middleware: [providerAsMiddleware(provider)],
      });

      const originalParams = [{ nested: "value" }];
      const req = makeRequest({ params: originalParams });

      await outerEngine.handle(req);

      expect(receivedParams).toStrictEqual(originalParams);
      expect(receivedParams).not.toBe(originalParams);
      expect((receivedParams as Record<string, unknown>[])[0]).not.toBe(originalParams[0]);
    });
  });
});
