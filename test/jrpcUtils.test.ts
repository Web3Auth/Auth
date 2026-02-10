import { describe, expect, it } from "vitest";

import { dataHasCause, errorCodes, getMessageFromCode, rpcErrors, serializeJrpcError } from "../src/jrpc/errors";
import { JRPCNotification, JRPCParams, JRPCRequest, JRPCResponse } from "../src/jrpc/interfaces";
import { isJRPCFailure, isJRPCNotification, isJRPCRequest, isJRPCSuccess, isValidMethod } from "../src/utils/jrpc";
import {
  dummyData,
  dummyMessage,
  invalidError0,
  invalidError1,
  invalidError2,
  invalidError3,
  invalidError4,
  invalidError5,
  invalidError6,
  invalidError7,
  validError0,
  validError1,
  validError2,
  validError3,
  validError4,
} from "./__fixtures__";

const rpcCodes = errorCodes.rpc;

describe("serializeError", function () {
  it("handles invalid error: non-object", function () {
    const result = serializeJrpcError(invalidError0);
    expect(result).toStrictEqual({
      code: rpcCodes.internal,
      message: getMessageFromCode(rpcCodes.internal),
      data: { cause: invalidError0 },
    });
  });

  it("handles invalid error: null", function () {
    const result = serializeJrpcError(invalidError5);
    expect(result).toStrictEqual({
      code: rpcCodes.internal,
      message: getMessageFromCode(rpcCodes.internal),
      data: { cause: invalidError5 },
    });
  });

  it("handles invalid error: undefined", function () {
    const result = serializeJrpcError(invalidError6);
    expect(result).toStrictEqual({
      code: rpcCodes.internal,
      message: getMessageFromCode(rpcCodes.internal),
      data: { cause: null },
    });
  });

  it("handles invalid error: array", function () {
    const result = serializeJrpcError(invalidError1);
    expect(result).toStrictEqual({
      code: rpcCodes.internal,
      message: getMessageFromCode(rpcCodes.internal),
      data: { cause: invalidError1 },
    });
  });

  it("handles invalid error: invalid code", function () {
    const result = serializeJrpcError(invalidError2);
    expect(result).toStrictEqual({
      code: rpcCodes.internal,
      message: getMessageFromCode(rpcCodes.internal),
      data: { cause: invalidError2 },
    });
  });

  it("handles invalid error: valid code, undefined message", function () {
    const result = serializeJrpcError(invalidError3);
    expect(result).toStrictEqual({
      code: errorCodes.rpc.internal,
      message: getMessageFromCode(errorCodes.rpc.internal),
      data: {
        cause: {
          code: 4001,
        },
      },
    });
  });

  it("handles invalid error: non-string message with data", function () {
    const result = serializeJrpcError(invalidError4);
    expect(result).toStrictEqual({
      code: rpcCodes.internal,
      message: getMessageFromCode(rpcCodes.internal),
      data: {
        cause: {
          code: invalidError4.code,
          message: invalidError4.message,
          data: { ...dummyData },
        },
      },
    });
  });

  it("handles invalid error: invalid code with string message", function () {
    const result = serializeJrpcError(invalidError7);
    expect(result).toStrictEqual({
      code: rpcCodes.internal,
      message: invalidError7.message,
      data: {
        cause: {
          code: invalidError7.code,
          message: invalidError7.message,
          data: { ...dummyData },
        },
      },
    });
  });

  it("handles invalid error: invalid code, no message, custom fallback", function () {
    const result = serializeJrpcError(invalidError2, {
      fallbackError: { code: rpcCodes.methodNotFound, message: "foo" },
    });
    expect(result).toStrictEqual({
      code: rpcCodes.methodNotFound,
      message: "foo",
      data: { cause: { ...invalidError2 } },
    });
  });

  it("handles valid error: code and message only", function () {
    const result = serializeJrpcError(validError0);
    expect(result).toStrictEqual({
      code: 4001,
      message: validError0.message,
    });
  });

  it("handles valid error: code, message, and data", function () {
    const result = serializeJrpcError(validError1);
    expect(result).toStrictEqual({
      code: 4001,
      message: validError1.message,
      data: { ...validError1.data },
    });
  });

  it("handles valid error: instantiated error", function () {
    const result = serializeJrpcError(validError2);
    expect(result).toStrictEqual({
      code: rpcCodes.parse,
      message: getMessageFromCode(rpcCodes.parse),
    });
  });

  it("handles valid error: other instantiated error", function () {
    const result = serializeJrpcError(validError3);
    expect(result).toStrictEqual({
      code: rpcCodes.parse,
      message: dummyMessage,
    });
  });

  it("handles valid error: instantiated error with custom message and data", function () {
    const result = serializeJrpcError(validError4);
    expect(result).toStrictEqual({
      code: rpcCodes.parse,
      message: validError4.message,
      data: { ...validError4.data, cause: null },
    });
  });

  it("handles valid error: message and data", function () {
    const result = serializeJrpcError({ ...validError1 });
    expect(result).toStrictEqual({
      code: 4001,
      message: validError1.message,
      data: { ...validError1.data },
    });
  });

  it("handles including stack: no stack present", function () {
    const result = serializeJrpcError(validError1);
    expect(result).toStrictEqual({
      code: 4001,
      message: validError1.message,
      data: { ...validError1.data },
    });
  });

  it("handles including stack: string stack present", function () {
    const result = serializeJrpcError({ ...validError1, stack: "foo" });
    expect(result).toStrictEqual({
      code: 4001,
      message: validError1.message,
      data: { ...validError1.data },
      stack: "foo",
    });
  });

  it("handles removing stack", function () {
    const result = serializeJrpcError({ ...validError1, stack: "foo" }, { shouldIncludeStack: false });
    expect(result).toStrictEqual({
      code: 4001,
      message: validError1.message,
      data: { ...validError1.data },
    });
  });

  it("handles regular Error()", function () {
    const error = new Error("foo");
    const result = serializeJrpcError(error);
    expect(result).toStrictEqual({
      code: errorCodes.rpc.internal,
      message: error.message,
      data: {
        cause: {
          message: error.message,
          stack: error.stack,
        },
      },
    });

    expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
      code: errorCodes.rpc.internal,
      message: error.message,
      data: {
        cause: {
          message: error.message,
          stack: error.stack,
        },
      },
    });
  });

  it("handles JsonRpcError", function () {
    const error = rpcErrors.invalidParams();
    const result = serializeJrpcError(error);
    expect(result).toStrictEqual({
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
  });

  it("handles class that has serialize function", function () {
    class MockClass {
      serialize() {
        return { code: 1, message: "foo" };
      }
    }
    const error = new MockClass();
    const result = serializeJrpcError(error);
    expect(result).toStrictEqual({
      code: 1,
      message: "foo",
    });

    expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
      code: 1,
      message: "foo",
    });
  });

  it("removes non JSON-serializable props on cause", function () {
    const error = new Error("foo");
    // @ts-expect-error Intentionally using wrong type
    error.message = () => undefined;
    const result = serializeJrpcError(error);
    expect(result).toStrictEqual({
      code: errorCodes.rpc.internal,
      message: getMessageFromCode(errorCodes.rpc.internal),
      data: {
        cause: {
          stack: error.stack,
        },
      },
    });
  });

  it("throws if fallback is invalid", function () {
    expect(() =>
      // @ts-expect-error Intentionally using wrong type
      serializeJrpcError(new Error(), { fallbackError: new Error() })
    ).toThrow(new Error("Must provide fallback error with integer number code and string message."));
  });

  it("handles arrays passed as error", function () {
    const error = ["foo", Symbol("bar"), { baz: "qux", symbol: Symbol("") }];
    const result = serializeJrpcError(error);
    expect(result).toStrictEqual({
      code: rpcCodes.internal,
      message: getMessageFromCode(rpcCodes.internal),
      data: {
        cause: ["foo", null, { baz: "qux" }],
      },
    });

    expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
      code: rpcCodes.internal,
      message: getMessageFromCode(rpcCodes.internal),
      data: {
        cause: ["foo", null, { baz: "qux" }],
      },
    });
  });
});

describe("dataHasCause", function () {
  it("returns false for invalid data types", function () {
    [undefined, null, "hello", 1234].forEach((data) => {
      const result = dataHasCause(data);
      expect(result).toBe(false);
    });
  });

  it("returns false for invalid cause types", function () {
    [undefined, null, "hello", 1234].forEach((cause) => {
      const result = dataHasCause({ cause });
      expect(result).toBe(false);
    });
  });

  it("returns true when cause is object", function () {
    const data = { cause: {} };
    const result = dataHasCause(data);
    expect(result).toBe(true);
  });
});

describe("isJRPCNotification", function () {
  it("returns true for a message without id", function () {
    const notification = { jsonrpc: "2.0", method: "notify", params: { value: 1 } } as unknown as JRPCNotification<JRPCParams>;
    expect(isJRPCNotification(notification)).toBe(true);
  });

  it("returns false for a message with id", function () {
    const request: JRPCRequest<JRPCParams> = { jsonrpc: "2.0", method: "test", params: {}, id: "1" };
    expect(isJRPCNotification(request)).toBe(false);
  });

  it("returns true when id is explicitly undefined", function () {
    expect(isJRPCNotification({ id: undefined, jsonrpc: "2.0", method: "test", params: {} })).toBe(true);
  });
});

describe("isJRPCRequest", function () {
  it("returns true for a message with id", function () {
    const request: JRPCRequest<JRPCParams> = { jsonrpc: "2.0", method: "test", params: {}, id: "1" };
    expect(isJRPCRequest(request)).toBe(true);
  });

  it("returns true for a message with numeric id", function () {
    const request: JRPCRequest<JRPCParams> = { jsonrpc: "2.0", method: "test", params: {}, id: 42 };
    expect(isJRPCRequest(request)).toBe(true);
  });

  it("returns false for a message without id", function () {
    const notification: JRPCNotification = { jsonrpc: "2.0", method: "notify", params: { value: 1 } };
    expect(isJRPCRequest(notification)).toBe(false);
  });
});

describe("isValidMethod", function () {
  it("returns true for a non-empty string method", function () {
    expect(isValidMethod({ method: "eth_call" })).toBe(true);
  });

  it("returns false for an empty string method", function () {
    expect(isValidMethod({ method: "" })).toBe(false);
  });

  it("returns false when method is undefined", function () {
    expect(isValidMethod({})).toBe(false);
  });

  it("returns false when method is a number", function () {
    // @ts-expect-error Intentionally using wrong type
    expect(isValidMethod({ method: 123 })).toBe(false);
  });

  it("returns false when method is null", function () {
    expect(isValidMethod({ method: null as unknown as string })).toBe(false);
  });
});

describe("isJRPCSuccess", function () {
  it("returns true when response has result", function () {
    expect(isJRPCSuccess({ jsonrpc: "2.0", id: "1", result: "ok" } as JRPCResponse<string>)).toBe(true);
  });

  it("returns true when result is null", function () {
    expect(isJRPCSuccess({ jsonrpc: "2.0", id: "1", result: null } as JRPCResponse<null>)).toBe(true);
  });

  it("returns true when result is undefined", function () {
    expect(isJRPCSuccess({ jsonrpc: "2.0", id: "1", result: undefined } as JRPCResponse<undefined>)).toBe(true);
  });

  it("returns false when response has no result", function () {
    expect(isJRPCSuccess({ jsonrpc: "2.0", id: "1" })).toBe(false);
  });

  it("returns false for a failure response", function () {
    expect(isJRPCSuccess({ jsonrpc: "2.0", id: "1", error: { code: -32600, message: "bad" } } as JRPCResponse<unknown>)).toBe(false);
  });
});

describe("isJRPCFailure", function () {
  it("returns true when response has error", function () {
    expect(isJRPCFailure({ jsonrpc: "2.0", id: "1", error: { code: -32600, message: "bad" } } as JRPCResponse<unknown>)).toBe(true);
  });

  it("returns false when response has no error", function () {
    expect(isJRPCFailure({ jsonrpc: "2.0", id: "1" })).toBe(false);
  });

  it("returns false for a success response", function () {
    expect(isJRPCFailure({ jsonrpc: "2.0", id: "1", result: "ok" } as JRPCResponse<string>)).toBe(false);
  });

  it("returns true when response has both result and error", function () {
    expect(isJRPCFailure({ jsonrpc: "2.0", id: "1", result: "ok", error: { code: -32600, message: "bad" } } as JRPCResponse<string>)).toBe(true);
  });
});
