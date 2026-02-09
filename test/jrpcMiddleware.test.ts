import { describe, expect, it, vi } from "vitest";

import { ConsoleLike, errorCodes, JRPCEngine, JRPCRequest, SerializableError } from "../src";
import {
  createAsyncMiddleware,
  createErrorMiddleware,
  createIdRemapMiddleware,
  createLoggerMiddleware,
  createScaffoldMiddleware,
  createStreamMiddleware,
} from "../src/jrpc/jrpc";

const MOCK_REQUEST: JRPCRequest<unknown> = {
  method: "mock",
  params: {},
  id: "1",
  jsonrpc: "2.0",
};

describe("Middlewares", () => {
  it("should create a Logger middleware", async () => {
    const mockLogger = {
      debug: vi.fn(),
    } as unknown as ConsoleLike;
    const logger = createLoggerMiddleware(mockLogger);
    expect(logger).toBeDefined();

    const engine = new JRPCEngine();
    engine.push(logger);
    await engine.handle(MOCK_REQUEST);
    expect(mockLogger.debug).toHaveBeenCalled();
  });

  it("should create an Error middleware", async () => {
    const mockLogger = {
      error: vi.fn(),
    } as unknown as ConsoleLike;
    const errorMiddleware = createErrorMiddleware(mockLogger);
    expect(errorMiddleware).toBeDefined();

    const engine = new JRPCEngine();
    engine.push(errorMiddleware);
    engine.push((_req, res, next, _end) => {
      res.error = new SerializableError({ code: errorCodes.rpc.invalidRequest, message: "invalid method" });
      next();
    });

    const response = await engine.handle(MOCK_REQUEST);
    expect(response.error).toBeDefined();
    expect(response.error?.message).toBe("invalid method");
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it("should push requests to the stream and resolve responses", async () => {
    const engine = new JRPCEngine();
    const { middleware, stream } = createStreamMiddleware();
    engine.push(middleware);

    const request: JRPCRequest<{ hello: string }> = {
      id: "stream-1",
      jsonrpc: "2.0",
      method: "hello",
      params: { hello: "world" },
    };

    const dataPromise = new Promise<JRPCRequest<unknown>>((resolve) => {
      stream.once("data", (data) => resolve(data as JRPCRequest<unknown>));
    });

    const responsePromise = engine.handle(request);

    const receivedRequest = await dataPromise;
    expect(receivedRequest).toEqual(request);

    stream.write({
      id: "stream-1",
      jsonrpc: "2.0",
      result: "ok",
    });

    const response = await responsePromise;
    expect(response.result).toBe("ok");
  });

  it("should emit notifications for messages without id", async () => {
    const { events, stream } = createStreamMiddleware();

    const notificationPromise = new Promise<JRPCRequest<unknown>>((resolve) => {
      events.once("notification", (payload) => {
        resolve(payload);
        return true;
      });
    });

    const notification: JRPCRequest<{ value: number }> = {
      jsonrpc: "2.0",
      method: "notify",
      params: { value: 42 },
    };

    stream.write(notification);

    const received = await notificationPromise;
    expect(received).toEqual(notification);
  });

  it("should error on responses with unknown ids", async () => {
    const { stream } = createStreamMiddleware();

    const errorPromise = new Promise<Error>((resolve) => {
      stream.once("error", (err) => resolve(err as Error));
    });

    stream.write({
      id: "missing-id",
      jsonrpc: "2.0",
      result: "noop",
    });

    const error = await errorPromise;
    expect(error.message).toBe('StreamMiddleware - Unknown response id "missing-id"');
  });

  it("should create a Scaffold middleware that returns constant results", async () => {
    const engine = new JRPCEngine();
    engine.push(
      createScaffoldMiddleware({
        hello: "world",
      })
    );

    const response = await engine.handle({
      id: "1",
      jsonrpc: "2.0",
      method: "hello",
    });

    expect(response.result).toBe("world");
  });

  it("should create a Scaffold middleware that falls through when no handler", async () => {
    const engine = new JRPCEngine();
    const mockFn = vi.fn();

    engine.push(
      createScaffoldMiddleware({
        hello: "world",
      })
    );
    engine.push((_req, res, _next, end) => {
      mockFn();
      res.result = "fallback";
      end();
    });

    const response = await engine.handle({
      id: "2",
      jsonrpc: "2.0",
      method: "unknown",
    });

    expect(mockFn).toHaveBeenCalled();
    expect(response.result).toBe("fallback");
  });

  it("should create an Async middleware that completes and runs return handlers", async () => {
    const engine = new JRPCEngine();
    const returnHandlerSpy = vi.fn();

    engine.push(
      createAsyncMiddleware(async (_req, res, next) => {
        res.result = "async-result";
        await next();
      })
    );
    engine.push((_req, _res, next, _end) => {
      next((done) => {
        returnHandlerSpy();
        done();
      });
    });
    engine.push((_req, _res, _next, end) => {
      end();
    });

    const response = await engine.handle({
      id: "1",
      jsonrpc: "2.0",
      method: "async",
    });

    expect(response.result).toBe("async-result");
    expect(returnHandlerSpy).toHaveBeenCalled();
  });

  it("should create an Async middleware that propagates errors", async () => {
    const engine = new JRPCEngine();
    const asyncError = new Error("async-fail");

    engine.push(
      createAsyncMiddleware(async () => {
        throw asyncError;
      })
    );

    const response = await engine.handle({
      id: "2",
      jsonrpc: "2.0",
      method: "async-error",
    });

    expect(response.error?.message).toBe("async-fail");
  });

  it("should remap request ids for downstream middleware and restore them", async () => {
    const engine = new JRPCEngine();
    const seenIds: Array<JRPCRequest<unknown>["id"]> = [];
    const originalId = "original-id";

    engine.push(createIdRemapMiddleware());
    engine.push((req, res, _next, end) => {
      seenIds.push(req.id);
      res.result = "ok";
      end();
    });

    const response = await engine.handle({
      id: originalId,
      jsonrpc: "2.0",
      method: "remap",
    });

    expect(seenIds).toHaveLength(1);
    expect(seenIds[0]).toBeDefined();
    expect(seenIds[0]).not.toBe(originalId);
    expect(response.id).toBe(originalId);
    expect(response.result).toBe("ok");
  });
});
