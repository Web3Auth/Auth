import { describe, expect, it, vi } from "vitest";

import { JRPCNotification, JRPCRequest, Json, rpcErrors } from "../../src";
import { JRPCEngineV2 } from "../../src/jrpc/v2/jrpcEngineV2";
import { JRPCServer } from "../../src/jrpc/v2/jrpcServer";
import type { MiddlewareContext } from "../../src/jrpc/v2/MiddlewareContext";
import type { JRPCMiddlewareV2 } from "../../src/jrpc/v2/v2interfaces";
import { JsonRpcEngineError } from "../../src/jrpc/v2/v2utils";
import { isRequest, stringify } from "../../src/utils/jrpc";

const jsonrpc = "2.0" as const;

const makeEngine = (): JRPCEngineV2 => {
  return JRPCEngineV2.create<JRPCMiddlewareV2>({
    middleware: [
      ({ request }): Json | undefined => {
        if (request.method !== "hello") {
          throw new Error("Unknown method");
        }
        return isRequest(request) ? ((request.params as Json) ?? null) : undefined;
      },
    ],
  });
};

describe("JsonRpcServer", () => {
  it("can be constructed with an engine", () => {
    const server = new JRPCServer({
      engine: makeEngine(),
      onError: (): undefined => undefined,
    });

    expect(server).toBeDefined();
  });

  it("can be constructed with middleware", () => {
    const server = new JRPCServer({
      middleware: [(): null => null],
      onError: (): undefined => undefined,
    });

    expect(server).toBeDefined();
  });

  it("handles a request", async () => {
    const server = new JRPCServer({
      engine: makeEngine(),
      onError: (): undefined => undefined,
    });

    const response = await server.handle({
      jsonrpc,
      id: 1,
      method: "hello",
    });

    expect(response).toStrictEqual({
      jsonrpc,
      id: 1,
      result: null,
    });
  });

  it("handles a request with params", async () => {
    const server = new JRPCServer({
      engine: makeEngine(),
      onError: (): undefined => undefined,
    });

    const response = await server.handle({
      jsonrpc,
      id: 1,
      method: "hello",
      params: ["world"],
    });

    expect(response).toStrictEqual({
      jsonrpc,
      id: 1,
      result: ["world"],
    });
  });

  it("handles a notification", async () => {
    const server = new JRPCServer({
      engine: makeEngine(),
      onError: (): undefined => undefined,
    });

    const response = await server.handle({
      jsonrpc,
      method: "hello",
    });

    expect(response).toBeUndefined();
  });

  it("handles a notification with params", async () => {
    const server = new JRPCServer({
      engine: makeEngine(),
      onError: (): undefined => undefined,
    });

    const response = await server.handle({
      jsonrpc,
      method: "hello",
      params: { hello: "world" },
    });

    expect(response).toBeUndefined();
  });

  it("forwards the context to the engine", async () => {
    const middleware: JRPCMiddlewareV2<JRPCRequest, string, MiddlewareContext<{ foo: string }>> = ({ context }) => {
      return context.assertGet("foo");
    };
    const server = new JRPCServer({
      middleware: [middleware],
      onError: (): undefined => undefined,
    });

    const response = await server.handle(
      {
        jsonrpc,
        id: 1,
        method: "hello",
      },
      {
        context: {
          foo: "bar",
        },
      }
    );

    expect(response).toStrictEqual({
      jsonrpc,
      id: 1,
      result: "bar",
    });
  });

  it("returns an error response for a failed request", async () => {
    const server = new JRPCServer({
      engine: makeEngine(),
      onError: (): undefined => undefined,
    });

    const response = await server.handle({
      jsonrpc,
      id: 1,
      method: "unknown",
    });

    expect(response).toStrictEqual({
      jsonrpc,
      id: 1,
      error: {
        code: -32603,
        message: "Unknown method",
        data: { cause: expect.any(Object) },
      },
    });
  });

  it("returns undefined for a failed notification", async () => {
    const server = new JRPCServer({
      engine: makeEngine(),
      onError: (): undefined => undefined,
    });

    const response = await server.handle({
      jsonrpc,
      method: "unknown",
    });

    expect(response).toBeUndefined();
  });

  it("calls onError for a failed request", async () => {
    const onError = vi.fn();
    const server = new JRPCServer({
      engine: makeEngine(),
      onError,
    });

    await server.handle({
      jsonrpc,
      id: 1,
      method: "unknown",
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(new Error("Unknown method"));
  });

  it("returns a failed request when onError is not provided", async () => {
    const server = new JRPCServer({
      engine: makeEngine(),
    });

    const response = await server.handle({
      jsonrpc,
      id: 1,
      method: "unknown",
    });

    expect(response).toStrictEqual({
      jsonrpc,
      id: 1,
      error: {
        code: -32603,
        message: "Unknown method",
        data: { cause: expect.any(Object) },
      },
    });
  });

  it("calls onError for a failed notification", async () => {
    const onError = vi.fn();
    const server = new JRPCServer({
      engine: makeEngine(),
      onError,
    });

    await server.handle({
      jsonrpc,
      method: "unknown",
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(new Error("Unknown method"));
  });

  it("accepts requests with malformed jsonrpc", async () => {
    const server = new JRPCServer({
      engine: makeEngine(),
      onError: (): undefined => undefined,
    });

    const response = await server.handle({
      jsonrpc: "1.0",
      id: 1,
      method: "hello",
    });

    expect(response).toStrictEqual({
      jsonrpc,
      id: 1,
      result: null,
    });
  });

  it("errors if passed a notification when only requests are supported", async () => {
    const onError = vi.fn();
    const server = new JRPCServer<JRPCMiddlewareV2<JRPCRequest>>({
      middleware: [(): null => null],
      onError,
    });

    const notification = { jsonrpc, method: "hello" };
    const response = await server.handle(notification);

    expect(response).toBeUndefined();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(new JsonRpcEngineError(`Result returned for notification: ${stringify(notification)}`));
  });

  it("errors if passed a request when only notifications are supported", async () => {
    const onError = vi.fn();
    const server = new JRPCServer<JRPCMiddlewareV2<JRPCNotification>>({
      middleware: [(): undefined => undefined],
      onError,
    });

    const request = { jsonrpc, id: 1, method: "hello" };
    const response = await server.handle(request);

    expect(response).toStrictEqual({
      jsonrpc,
      id: 1,
      error: {
        code: -32603,
        message: expect.stringMatching(/^Nothing ended request: /u),
        data: { cause: expect.any(Object) },
      },
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        // Using a regex match because id in the error message is not predictable.
        message: expect.stringMatching(/^Nothing ended request: /u),
      })
    );
  });

  it.each([undefined, Symbol("test"), null, true, false, {}, []])("accepts requests with malformed ids", async (id) => {
    const server = new JRPCServer({
      engine: makeEngine(),
      onError: (): undefined => undefined,
    });

    const response = await server.handle({
      jsonrpc,
      id,
      method: "hello",
    });

    expect(response).toStrictEqual({
      jsonrpc,
      id,
      result: null,
    });
  });

  it.each([
    null,
    {},
    [],
    false,
    true,
    { method: "hello", params: "world" },
    { method: "hello", params: null },
    { method: "hello", params: undefined },
    { params: ["world"] },
    { jsonrpc },
    { id: 1 },
  ])("errors if the request is not minimally conformant", async (malformedRequest) => {
    const onError = vi.fn();
    const server = new JRPCServer({
      engine: makeEngine(),
      onError,
    });

    await server.handle(malformedRequest);

    const invalidRequestError = rpcErrors.invalidRequest({
      data: {
        request: malformedRequest,
      },
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(invalidRequestError);
  });
});
