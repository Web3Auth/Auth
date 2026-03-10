import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type PostMessagePayload = {
  data: {
    params: Array<Record<string, unknown>>;
  };
};

describe("PostMessageStream", () => {
  let targetWindow: { postMessage: ReturnType<typeof vi.fn> };

  async function createStream() {
    const { PostMessageStream } = await import("../src/jrpc/postMessageStream");
    const stream = new PostMessageStream({
      name: "provider",
      target: "auth",
      targetWindow: targetWindow as unknown as Window,
    });

    targetWindow.postMessage.mockClear();

    return stream;
  }

  beforeEach(() => {
    vi.resetModules();
    targetWindow = { postMessage: vi.fn() };

    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      location: { origin: "https://current.example" },
      postMessage: vi.fn(),
    });
    vi.stubGlobal("MessageEvent", class MessageEventMock {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes the current origin into the posted payload params", async () => {
    const stream = await createStream();
    const payload: PostMessagePayload = { data: { params: [{}] } };

    (stream as unknown as { _postMessage: (data: unknown) => void })._postMessage(payload);

    expect(targetWindow.postMessage).toHaveBeenCalledOnce();
    const [message, originConstraint] = targetWindow.postMessage.mock.calls[0] as [{ target: string; data: PostMessagePayload }, string];

    expect(originConstraint).toBe("*");
    expect(message.target).toBe("auth");
    expect(message.data.data.params[0]._origin).toBe("https://current.example");
    // the original payload should not be mutated
    expect(payload.data.params[0]._origin).toBeUndefined();
  });

  it("uses the previous _origin as the postMessage origin constraint before rewriting it", async () => {
    const stream = await createStream();
    const payload: PostMessagePayload = {
      data: {
        params: [{ _origin: "https://allowed.example" }],
      },
    };

    (stream as unknown as { _postMessage: (data: unknown) => void })._postMessage(payload);

    expect(targetWindow.postMessage).toHaveBeenCalledOnce();
    const [message, originConstraint] = targetWindow.postMessage.mock.calls[0] as [{ target: string; data: PostMessagePayload }, string];

    expect(originConstraint).toBe("https://allowed.example");
    expect(message.target).toBe("auth");
    expect(message.data.data.params[0]._origin).toBe("https://current.example");
  });
});
