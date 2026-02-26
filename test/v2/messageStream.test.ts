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
  let capturedWrite: (req: Record<string, unknown>, encoding: string) => void;

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

  describe("request handling", () => {
    it("pushes a success response for a request", async () => {
      const engine = createMockEngine(vi.fn().mockResolvedValue("hello"));
      setup(engine);

      capturedWrite(makeRequest({ id: "42" }), "utf-8");
      await flushPromises();

      expect(engine.handle).toHaveBeenCalledOnce();
      expect(mockStream.push).toHaveBeenCalledWith({
        id: "42",
        jsonrpc: "2.0",
        result: "hello",
      });
    });

    it("pushes a null result when engine returns null", async () => {
      setup(createMockEngine());

      capturedWrite(makeRequest({ id: "1" }), "utf-8");
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledWith({
        id: "1",
        jsonrpc: "2.0",
        result: null,
      });
    });

    it("pushes complex result objects", async () => {
      setup(createMockEngine(vi.fn().mockResolvedValue({ data: [1, 2, 3] })));

      capturedWrite(makeRequest({ id: "99" }), "utf-8");
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledWith({
        id: "99",
        jsonrpc: "2.0",
        result: { data: [1, 2, 3] },
      });
    });

    it("preserves the request id in the response", async () => {
      setup(createMockEngine(vi.fn().mockResolvedValue("ok")));

      capturedWrite(makeRequest({ id: "abc-123" }), "utf-8");
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledWith(expect.objectContaining({ id: "abc-123" }));
    });

    it("handles multiple sequential requests", async () => {
      let counter = 0;
      setup(createMockEngine(vi.fn().mockImplementation(() => Promise.resolve(++counter))));

      capturedWrite(makeRequest({ id: "a" }), "utf-8");
      capturedWrite(makeRequest({ id: "b" }), "utf-8");
      capturedWrite(makeRequest({ id: "c" }), "utf-8");
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

      capturedWrite(makeRequest({ id: "err-1" }), "utf-8");
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

      capturedWrite(makeRequest({ id: "err-2" }), "utf-8");
      await flushPromises();

      const pushed = mockStream.push.mock.calls[0][0] as Record<string, unknown>;
      expect((pushed.error as Record<string, unknown>).message).toContain("specific failure");
    });

    it("uses a fallback message for non-Error throws", async () => {
      setup(createMockEngine(vi.fn().mockRejectedValue("string error")));

      capturedWrite(makeRequest({ id: "err-3" }), "utf-8");
      await flushPromises();

      const pushed = mockStream.push.mock.calls[0][0] as Record<string, unknown>;
      expect((pushed.error as Record<string, unknown>).message).toContain("Internal JSON-RPC error");
    });
  });

  describe("notification handling", () => {
    it("does not push a response for notifications (no id)", async () => {
      setup(createMockEngine(vi.fn().mockResolvedValue(undefined)));

      capturedWrite(makeNotification(), "utf-8");
      await flushPromises();

      expect(mockStream.push).not.toHaveBeenCalled();
    });

    it("does not push an error response for notification failures", async () => {
      setup(createMockEngine(vi.fn().mockRejectedValue(new Error("notification error"))));

      capturedWrite(makeNotification(), "utf-8");
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

      capturedWrite(makeRequest({ id: "x" }), "utf-8");
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

      capturedWrite(makeRequest({ id: "1" }), "utf-8");
      await flushPromises();

      expect(mockStream.push).toHaveBeenCalledWith({
        id: "1",
        jsonrpc: "2.0",
        result: "no-emitter",
      });
    });
  });
});
