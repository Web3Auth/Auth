import { Duplex } from "readable-stream";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import type { SafeEventEmitter } from "../../src/jrpc/safeEventEmitter";
import type { JRPCEngineV2 } from "../../src/jrpc/v2/jrpcEngineV2";
import { createEngineStreamV2 } from "../../src/jrpc/v2/messageStream";

vi.mock("readable-stream", () => {
  function MockDuplex(this: Record<string, unknown>, opts: Record<string, unknown>) {
    Object.assign(this, (MockDuplex as unknown as { _instance: Record<string, unknown> })._instance);
    (MockDuplex as unknown as { _capturedOpts: Record<string, unknown> })._capturedOpts = opts;
  }
  return { Duplex: MockDuplex };
});
vi.mock("loglevel", () => ({ default: { error: vi.fn() } }));

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeRequest(overrides: Record<string, unknown> = {}) {
  return { jsonrpc: "2.0", id: "1", method: "test", params: [] as unknown[], ...overrides };
}

function makeNotification(overrides: Record<string, unknown> = {}) {
  return { jsonrpc: "2.0", method: "test", params: [] as unknown[], ...overrides };
}

describe("createEngineStreamV2", () => {
  let mockStream: Record<string, Mock>;
  let capturedWrite: (req: Record<string, unknown>, encoding: string, cb: (error?: Error | null) => void) => void;

  function createMockEngine(handleImpl: Mock = vi.fn().mockResolvedValue(null)) {
    return { handle: handleImpl } as unknown as JRPCEngineV2;
  }

  function createMockEmitter() {
    return {
      on: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as SafeEventEmitter;
  }

  function getCapturedOpts(): Record<string, unknown> {
    return (Duplex as unknown as { _capturedOpts: Record<string, unknown> })._capturedOpts;
  }

  function setup(engine: JRPCEngineV2, notificationEmitter?: SafeEventEmitter) {
    const stream = createEngineStreamV2({ engine, notificationEmitter });
    capturedWrite = getCapturedOpts().write as typeof capturedWrite;
    return stream;
  }

  beforeEach(() => {
    mockStream = {
      push: vi.fn(),
      once: vi.fn(),
    };

    (Duplex as unknown as { _instance: Record<string, Mock> })._instance = mockStream;
  });

  it("creates a Duplex in objectMode with read and write", () => {
    setup(createMockEngine());

    const opts = getCapturedOpts();
    expect(opts.objectMode).toBe(true);
    expect(typeof opts.read).toBe("function");
    expect(typeof opts.write).toBe("function");
  });

  it("returns the created stream", () => {
    const result = setup(createMockEngine());
    expect(result).toHaveProperty("push", mockStream.push);
    expect(result).toHaveProperty("once", mockStream.once);
  });

  it("invokes the write callback to signal backpressure release", async () => {
    setup(createMockEngine());

    const cb = vi.fn();
    capturedWrite(makeRequest(), "utf-8", cb);
    await flushPromises();

    expect(cb).toHaveBeenCalledOnce();
  });

  describe("request handling", () => {
    it("pushes a success response for a request", async () => {
      const engine = createMockEngine(vi.fn().mockResolvedValue("hello"));
      setup(engine);

      const cb = vi.fn();
      capturedWrite(makeRequest({ id: "42" }), "utf-8", cb);
      await flushPromises();

      expect(engine.handle).toHaveBeenCalledOnce();
      expect(cb).toHaveBeenCalledOnce();
      expect(mockStream.push).toHaveBeenCalledWith({
        id: "42",
        jsonrpc: "2.0",
        result: "hello",
      });
    });

    it("pushes a null result when engine returns null", async () => {
      setup(createMockEngine());

      capturedWrite(makeRequest({ id: "1" }), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledWith({
        id: "1",
        jsonrpc: "2.0",
        result: null,
      });
    });

    it("pushes complex result objects", async () => {
      setup(createMockEngine(vi.fn().mockResolvedValue({ data: [1, 2, 3] })));

      capturedWrite(makeRequest({ id: "99" }), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledWith({
        id: "99",
        jsonrpc: "2.0",
        result: { data: [1, 2, 3] },
      });
    });

    it("preserves the request id in the response", async () => {
      setup(createMockEngine(vi.fn().mockResolvedValue("ok")));

      capturedWrite(makeRequest({ id: "abc-123" }), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "abc-123" }));
    });

    it("handles multiple sequential requests", async () => {
      let counter = 0;
      setup(createMockEngine(vi.fn().mockImplementation(() => Promise.resolve(++counter))));

      capturedWrite(makeRequest({ id: "a" }), "utf-8", vi.fn());
      capturedWrite(makeRequest({ id: "b" }), "utf-8", vi.fn());
      capturedWrite(makeRequest({ id: "c" }), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledTimes(3);
      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "c" }));
    });
  });

  describe("error handling", () => {
    it("pushes an error response when the engine rejects", async () => {
      setup(createMockEngine(vi.fn().mockRejectedValue(new Error("engine failure"))));

      capturedWrite(makeRequest({ id: "err-1" }), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          id: "err-1",
          jsonrpc: "2.0",
          error: expect.objectContaining({ message: expect.stringContaining("engine failure") }),
        })
      );
    });

    it("includes the error message in the error response", async () => {
      setup(createMockEngine(vi.fn().mockRejectedValue(new Error("specific failure"))));

      capturedWrite(makeRequest({ id: "err-2" }), "utf-8", vi.fn());
      await flushPromises();

      const pushed = mockStream.push.mock.calls[0][0] as Record<string, unknown>;
      expect((pushed.error as Record<string, unknown>).message).toContain("specific failure");
    });

    it("calls cb() without an error to keep the stream alive", async () => {
      setup(createMockEngine(vi.fn().mockRejectedValue(new Error("engine failure"))));

      const cb = vi.fn();
      capturedWrite(makeRequest({ id: "err-alive" }), "utf-8", cb);
      await flushPromises();

      expect(cb).toHaveBeenCalledOnce();
    });

    it("uses a fallback message for non-Error throws", async () => {
      setup(createMockEngine(vi.fn().mockRejectedValue("string error")));

      capturedWrite(makeRequest({ id: "err-3" }), "utf-8", vi.fn());
      await flushPromises();

      const pushed = mockStream.push.mock.calls[0][0] as Record<string, unknown>;
      expect((pushed.error as Record<string, unknown>).message).toContain("Internal JSON-RPC error");
    });
  });

  describe("notification handling", () => {
    it("does not push a response for notifications (no id)", async () => {
      setup(createMockEngine(vi.fn().mockResolvedValue(undefined)));

      capturedWrite(makeNotification(), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).not.toHaveBeenCalled();
    });

    it("does not push an error response for notification failures", async () => {
      setup(createMockEngine(vi.fn().mockRejectedValue(new Error("notification error"))));

      capturedWrite(makeNotification(), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).not.toHaveBeenCalled();
    });
  });

  describe("notificationEmitter", () => {
    it("registers a notification listener on the emitter", () => {
      const emitter = createMockEmitter();
      setup(createMockEngine(), emitter);

      expect(emitter.on).toHaveBeenCalledWith("notification", expect.any(Function));
    });

    it("pushes emitted notifications onto the stream", () => {
      const emitter = createMockEmitter();
      setup(createMockEngine(), emitter);

      const handler = vi.mocked(emitter.on).mock.calls.find(([event]) => event === "notification")![1] as (msg: unknown) => void;
      const notification = { jsonrpc: "2.0", method: "eth_subscription", params: { result: "0x1" } };
      handler(notification);

      expect(mockStream.push).toHaveBeenCalledWith(notification);
    });

    it("pushes multiple notifications", () => {
      const emitter = createMockEmitter();
      setup(createMockEngine(), emitter);

      const handler = vi.mocked(emitter.on).mock.calls.find(([event]) => event === "notification")![1] as (msg: unknown) => void;
      handler({ type: "a" });
      handler({ type: "b" });
      handler({ type: "c" });

      expect(mockStream.push).toHaveBeenCalledTimes(3);
    });

    it("registers a close listener to clean up", () => {
      const emitter = createMockEmitter();
      setup(createMockEngine(), emitter);

      expect(mockStream.once).toHaveBeenCalledWith("close", expect.any(Function));
    });

    it("removes the notification listener when the stream closes", () => {
      const emitter = createMockEmitter();
      setup(createMockEngine(), emitter);

      const notificationHandler = vi.mocked(emitter.on).mock.calls.find(([event]) => event === "notification")![1];
      const closeHandler = mockStream.once.mock.calls.find(([event]) => event === "close")![1] as () => void;
      closeHandler();

      expect(emitter.removeListener).toHaveBeenCalledWith("notification", notificationHandler);
    });

    it("does not interfere with request/response flow", async () => {
      const emitter = createMockEmitter();
      const engine = createMockEngine(vi.fn().mockResolvedValue("result"));
      setup(engine, emitter);

      const handler = vi.mocked(emitter.on).mock.calls.find(([event]) => event === "notification")![1] as (msg: unknown) => void;
      handler({ method: "notif" });

      capturedWrite(makeRequest({ id: "x" }), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledTimes(2);
      expect(mockStream.push).toHaveBeenCalledWith({ method: "notif" });
      expect(mockStream.push).toHaveBeenCalledWith({
        id: "x",
        jsonrpc: "2.0",
        result: "result",
      });
    });
  });

  describe("without notificationEmitter", () => {
    it("does not register a close listener on the stream", () => {
      setup(createMockEngine());
      expect(mockStream.once).not.toHaveBeenCalled();
    });

    it("handles requests normally", async () => {
      setup(createMockEngine(vi.fn().mockResolvedValue("no-emitter")));

      capturedWrite(makeRequest({ id: "1" }), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledWith({
        id: "1",
        jsonrpc: "2.0",
        result: "no-emitter",
      });
    });
  });

  describe("concurrent / async edge cases", () => {
    it("calls cb() synchronously before engine.handle resolves", () => {
      let handleResolved = false;
      const engine = createMockEngine(
        vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              setTimeout(() => {
                handleResolved = true;
                resolve("delayed");
              }, 100);
            })
        )
      );
      setup(engine);

      const cb = vi.fn();
      capturedWrite(makeRequest({ id: "sync-check" }), "utf-8", cb);

      expect(cb).toHaveBeenCalledOnce();
      expect(handleResolved).toBe(false);
    });

    it("does not block subsequent writes while a slow request is pending", () => {
      const callOrder: string[] = [];
      const engine = createMockEngine(
        vi.fn().mockImplementation((req: Record<string, unknown>) => {
          callOrder.push(`handle:${req.id}`);
          return new Promise((resolve) => setTimeout(() => resolve(`result:${req.id}`), 50));
        })
      );
      setup(engine);

      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const cb3 = vi.fn();
      capturedWrite(makeRequest({ id: "1" }), "utf-8", cb1);
      capturedWrite(makeRequest({ id: "2" }), "utf-8", cb2);
      capturedWrite(makeRequest({ id: "3" }), "utf-8", cb3);

      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
      expect(cb3).toHaveBeenCalledOnce();
      expect(callOrder).toEqual(["handle:1", "handle:2", "handle:3"]);
    });

    it("resolves a dependent request while a long-running request is still pending (deadlock prevention)", async () => {
      let resolveSlowRequest: (value: string) => void;
      const slowRequestPromise = new Promise<string>((resolve) => {
        resolveSlowRequest = resolve;
      });

      const engine = createMockEngine(
        vi.fn().mockImplementation((req: Record<string, unknown>) => {
          if (req.method === "slow") return slowRequestPromise;
          if (req.method === "fast") return Promise.resolve("fast-result");
          return Promise.resolve(null);
        })
      );
      setup(engine);

      capturedWrite(makeRequest({ id: "slow-1", method: "slow" }), "utf-8", vi.fn());
      capturedWrite(makeRequest({ id: "fast-1", method: "fast" }), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledWith({
        id: "fast-1",
        jsonrpc: "2.0",
        result: "fast-result",
      });

      resolveSlowRequest!("slow-result");
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledWith({
        id: "slow-1",
        jsonrpc: "2.0",
        result: "slow-result",
      });
    });

    it("delivers responses out of order when requests complete at different times", async () => {
      const resolvers: Record<string, (value: string) => void> = {};
      const engine = createMockEngine(
        vi.fn().mockImplementation(
          (req: Record<string, unknown>) =>
            new Promise<string>((resolve) => {
              resolvers[req.id as string] = resolve;
            })
        )
      );
      setup(engine);

      capturedWrite(makeRequest({ id: "first" }), "utf-8", vi.fn());
      capturedWrite(makeRequest({ id: "second" }), "utf-8", vi.fn());
      capturedWrite(makeRequest({ id: "third" }), "utf-8", vi.fn());

      resolvers["third"]("result-3");
      await flushPromises();
      expect(mockStream.push).toHaveBeenCalledTimes(1);
      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "third", result: "result-3" }));

      resolvers["first"]("result-1");
      await flushPromises();
      expect(mockStream.push).toHaveBeenCalledTimes(2);
      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "first", result: "result-1" }));

      resolvers["second"]("result-2");
      await flushPromises();
      expect(mockStream.push).toHaveBeenCalledTimes(3);
      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "second", result: "result-2" }));
    });

    it("handles a mix of successes and failures in concurrent requests", async () => {
      const engine = createMockEngine(
        vi.fn().mockImplementation((req: Record<string, unknown>) => {
          if (req.method === "fail") return Promise.reject(new Error("boom"));
          return Promise.resolve("ok");
        })
      );
      setup(engine);

      capturedWrite(makeRequest({ id: "1", method: "succeed" }), "utf-8", vi.fn());
      capturedWrite(makeRequest({ id: "2", method: "fail" }), "utf-8", vi.fn());
      capturedWrite(makeRequest({ id: "3", method: "succeed" }), "utf-8", vi.fn());
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledTimes(3);
      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "1", result: "ok" }));
      expect(mockStream.push).toHaveBeenCalledWith(
        expect.objectContaining({ id: "2", error: expect.objectContaining({ message: expect.stringContaining("boom") }) })
      );
      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "3", result: "ok" }));
    });

    it("a rejected request does not affect other in-flight requests", async () => {
      const resolvers: Record<string, (value: string) => void> = {};
      const rejecters: Record<string, (error: Error) => void> = {};
      const engine = createMockEngine(
        vi.fn().mockImplementation(
          (req: Record<string, unknown>) =>
            new Promise<string>((resolve, reject) => {
              resolvers[req.id as string] = resolve;
              rejecters[req.id as string] = reject;
            })
        )
      );
      setup(engine);

      capturedWrite(makeRequest({ id: "ok" }), "utf-8", vi.fn());
      capturedWrite(makeRequest({ id: "bad" }), "utf-8", vi.fn());

      rejecters["bad"](new Error("failed"));
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledTimes(1);
      expect(mockStream.push).toHaveBeenCalledWith(
        expect.objectContaining({ id: "bad", error: expect.objectContaining({ message: expect.stringContaining("failed") }) })
      );

      resolvers["ok"]("success");
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledTimes(2);
      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "ok", result: "success" }));
    });

    it("notifications can be emitted while requests are in-flight", async () => {
      let resolveRequest: (value: string) => void;
      const engine = createMockEngine(
        vi.fn().mockImplementation(
          () =>
            new Promise<string>((resolve) => {
              resolveRequest = resolve;
            })
        )
      );
      const emitter = createMockEmitter();
      setup(engine, emitter);

      const notifHandler = vi.mocked(emitter.on).mock.calls.find(([event]) => event === "notification")![1] as (msg: unknown) => void;

      capturedWrite(makeRequest({ id: "pending" }), "utf-8", vi.fn());

      notifHandler({ method: "subscription_update", params: { data: "xyz" } });
      expect(mockStream.push).toHaveBeenCalledTimes(1);
      expect(mockStream.push).toHaveBeenCalledWith({ method: "subscription_update", params: { data: "xyz" } });

      resolveRequest!("done");
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledTimes(2);
      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "pending", result: "done" }));
    });

    it("handles high concurrency without losing responses", async () => {
      const count = 50;
      const engine = createMockEngine(
        vi.fn().mockImplementation((req: Record<string, unknown>) => {
          const delay = Math.floor(Math.random() * 10);
          return new Promise((resolve) => setTimeout(() => resolve(`result-${req.id}`), delay));
        })
      );
      setup(engine);

      const callbacks = Array.from({ length: count }, () => vi.fn());
      for (let i = 0; i < count; i++) {
        capturedWrite(makeRequest({ id: `req-${i}` }), "utf-8", callbacks[i]);
      }

      callbacks.forEach((cb) => expect(cb).toHaveBeenCalledOnce());

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockStream.push).toHaveBeenCalledTimes(count);
      for (let i = 0; i < count; i++) {
        expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: `req-${i}`, result: `result-req-${i}` }));
      }
    });
  });
});
