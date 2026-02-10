import { describe, expect, it, vi } from "vitest";

import { SerializableError } from "../src";
import { errorCodes } from "../src/jrpc/errors";
import { JRPCEngineNextCallback, JRPCMiddleware, JRPCParams, JRPCRequest, JRPCResponse } from "../src/jrpc/interfaces";
import { createEngineStream, JRPCEngine, mergeMiddleware, providerAsMiddleware, providerFromEngine } from "../src/jrpc/jrpcEngine";

const MOCK_REQUEST: JRPCRequest<JRPCParams> = {
  method: "mock",
  params: {},
  id: "1",
  jsonrpc: "2.0",
};

describe("JRPCEngine", () => {
  it("should add middleware to the engine", async () => {
    const engine = new JRPCEngine();
    const mockFn = vi.fn();

    const middleware = (_req: JRPCRequest<JRPCParams>, _res: JRPCResponse<unknown>, _next: () => void, end: () => void) => {
      mockFn();
      end();
    };
    engine.push(middleware);

    await engine.handle(MOCK_REQUEST);
    expect(mockFn).toHaveBeenCalled();
  });

  it("should call the callback with an error for invalid requests", () => {
    const engine = new JRPCEngine();
    const mockCallback = vi.fn();
    const error = new SerializableError({ code: errorCodes.rpc.invalidRequest, message: "Requests must be plain objects. Received: object" });

    engine.handle(null, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(error, {
      id: undefined,
      jsonrpc: "2.0",
      error,
    });
  });

  it("should throw an error if provided a non-function callback", () => {
    const engine = new JRPCEngine();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- testing invalid callback
    expect(() => engine.handle(MOCK_REQUEST, "not a function" as any)).toThrow('"callback" must be a function if provided.');
  });

  it("should handle a batch of requests", () => {
    const engine = new JRPCEngine();
    const mockCallback = vi.fn();
    const mockFn = vi.fn();
    const requests = [MOCK_REQUEST, MOCK_REQUEST];

    const middleware = (_req: JRPCRequest<JRPCParams>, res: JRPCResponse<unknown>, _next: () => void, end: () => void) => {
      res.result = "test";
      mockFn();
      end();
    };
    engine.push(middleware);

    engine.handle(requests, mockCallback);
    expect(mockFn).toHaveBeenCalledTimes(requests.length);
  });

  it("should handle error thrown from batch requests", async () => {
    const engine = new JRPCEngine();
    const middleware = (_req: JRPCRequest<JRPCParams>, _res: JRPCResponse<unknown>, _next: () => void, _end: () => void) => {
      throw new Error("test error");
    };
    engine.push(middleware);
    const response = await engine.handle([MOCK_REQUEST, MOCK_REQUEST]);
    expect(response[0].error).toBeDefined();
    expect(response[0].error?.message).toBe("test error");
    expect(response[1].error).toBeDefined();
    expect(response[1].error?.message).toBe("test error");
  });

  it("should execute the return handlers if provided in `next` function", async () => {
    const engine = new JRPCEngine();
    const mockReturnHandler = vi.fn();

    const middleware = (_req: JRPCRequest<JRPCParams>, res: JRPCResponse<unknown>, next: JRPCEngineNextCallback, _end: () => void) => {
      res.result = "test";
      next((done) => {
        mockReturnHandler();
        done();
      });
    };
    engine.push(middleware);

    const middleware2 = (_req: JRPCRequest<JRPCParams>, res: JRPCResponse<unknown>, _next: JRPCEngineNextCallback, end: () => void) => {
      res.result = "test2";
      end();
    };
    engine.push(middleware2);

    await engine.handle(MOCK_REQUEST);

    expect(mockReturnHandler).toHaveBeenCalled();
  });
});

describe("JRPCEngine Middlewares", () => {
  it("should merge middleware stacks", async () => {
    const engine = new JRPCEngine();

    const middleware = (_req: JRPCRequest<JRPCParams>, res: JRPCResponse<unknown>, next: JRPCEngineNextCallback, _end: () => void) => {
      res.result = ["merged-md-1"];
      next();
    };

    const middleware2 = ((_req: JRPCRequest<JRPCParams>, res: JRPCResponse<string[]>, _next: JRPCEngineNextCallback, end: () => void) => {
      res.result = [...res.result, "merged-md-2"];
      end();
    }) as JRPCMiddleware<JRPCParams, unknown>;

    const mergedMiddleware = mergeMiddleware([middleware, middleware2]);
    engine.push(mergedMiddleware);
    const response = await engine.handle(MOCK_REQUEST);
    expect(response.result).toEqual(["merged-md-1", "merged-md-2"]);
  });

  it("should be able to execute merged middleware stack and normal middleware stack together", async () => {
    const engine = new JRPCEngine();

    const mergedMiddleware = mergeMiddleware([
      (_req: JRPCRequest<JRPCParams>, res: JRPCResponse<unknown>, next: JRPCEngineNextCallback, _end: () => void) => {
        const prevResult = Array.isArray(res.result) ? res.result : [];
        res.result = [...prevResult, "merged-md-1"];
        next();
      },
      (_req: JRPCRequest<JRPCParams>, res: JRPCResponse<unknown>, next: JRPCEngineNextCallback, _end: () => void) => {
        res.result = [...(res.result as string[]), "merged-md-2"];
        next();
      },
    ]);
    engine.push(mergedMiddleware);

    const middleware = (_req: JRPCRequest<JRPCParams>, res: JRPCResponse<unknown>, _next: JRPCEngineNextCallback, end: () => void) => {
      res.result = [...(res.result as string[]), "middleware"];
      end();
    };
    engine.push(middleware);

    const response = await engine.handle(MOCK_REQUEST);
    expect(response.result).toEqual(["merged-md-1", "merged-md-2", "middleware"]);
  });
});

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
    const response = await engine.handle({ id: 1, jsonrpc: "2.0", method: 123 as any, params: null });
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

describe("Provider", () => {
  const createEngine = () => {
    const engine = new JRPCEngine();
    engine.push((_req: JRPCRequest<JRPCParams>, res: JRPCResponse<unknown>, _next: JRPCEngineNextCallback, end: () => void) => {
      res.result = "engine-middleware-1";
      end();
    });
    return engine;
  };

  it("should return a provider from the engine", async () => {
    const engine = createEngine();

    const provider = providerFromEngine(engine);
    expect(provider).toBeDefined();

    const response = await provider.request({ method: "testProviderRequest" });
    expect(response).toBe("engine-middleware-1");
  });

  it("should be able to use provider as middleware", async () => {
    const engine1 = createEngine();
    const provider = providerFromEngine(engine1);
    const providerMiddleware = providerAsMiddleware(provider);

    const engine2 = new JRPCEngine();
    engine2.push(providerMiddleware);
    const response = await engine2.handle(MOCK_REQUEST);
    expect(response.result).toBe("engine-middleware-1");
  });
});

describe("createEngineStream", () => {
  it("should throw an error when engine option is missing", () => {
    expect(() => createEngineStream(undefined as never)).toThrow("Missing engine parameter!");
    expect(() => createEngineStream({} as never)).toThrow("Missing engine parameter!");
  });

  it("should push responses for handled requests", async () => {
    const engine = new JRPCEngine();
    engine.push((_req: JRPCRequest<JRPCParams>, res: JRPCResponse<unknown>, _next: JRPCEngineNextCallback, end: () => void) => {
      res.result = "stream-result";
      end();
    });

    const stream = createEngineStream({ engine });
    const responsePromise = new Promise<JRPCResponse<unknown>>((resolve) => {
      stream.once("data", (data) => resolve(data as JRPCResponse<unknown>));
    });

    stream.write(MOCK_REQUEST);
    const response = await responsePromise;
    expect(response.result).toBe("stream-result");
  });

  it("should forward notifications from the engine", async () => {
    const engine = new JRPCEngine();
    const stream = createEngineStream({ engine });
    const notification = { type: "notification", payload: "notification-payload" };

    const dataPromise = new Promise<unknown>((resolve) => {
      stream.once("data", (data) => resolve(data));
    });

    engine.emit("notification", notification);
    const received = await dataPromise;
    expect(received).toEqual(notification);
  });

  it("should remove notification listener on stream close", async () => {
    const engine = new JRPCEngine();
    const stream = createEngineStream({ engine });
    expect(engine.listenerCount("notification")).toBe(1);

    const closePromise = new Promise<void>((resolve) => {
      stream.once("close", resolve);
    });
    stream.destroy();
    await closePromise;

    // notification listener should be removed after stream close
    expect(engine.listenerCount("notification")).toBe(0);
  });
});
