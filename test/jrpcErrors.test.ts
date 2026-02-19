import { describe, expect, it } from "vitest";

import { errorCodes, getMessageFromCode, isPlainObject, JSON_RPC_SERVER_ERROR_MESSAGE, providerErrors, rpcErrors } from "../src/jrpc/errors";
import { SerializableError } from "../src/jrpc/serializableError";
import { CUSTOM_ERROR_CODE, CUSTOM_ERROR_MESSAGE, dummyData, dummyDataWithCause, dummyMessage, SERVER_ERROR_CODE } from "./__fixtures__";

describe("rpcErrors.invalidInput", () => {
  it("accepts a single string argument where appropriate", () => {
    const error = rpcErrors.invalidInput(CUSTOM_ERROR_MESSAGE);
    expect(error.code).toBe(errorCodes.rpc.invalidInput);
    expect(error.message).toBe(CUSTOM_ERROR_MESSAGE);
  });
});

describe("providerErrors.unauthorized", () => {
  it("accepts a single string argument where appropriate", () => {
    const error = providerErrors.unauthorized(CUSTOM_ERROR_MESSAGE);
    expect(error.code).toBe(errorCodes.provider.unauthorized);
    expect(error.message).toBe(CUSTOM_ERROR_MESSAGE);
  });
});

describe("custom provider error options", () => {
  it("throws if the value is not an options object", () => {
    expect(() => {
      // @ts-expect-error Invalid input
      providerErrors.custom("bar");
    }).toThrow("Ethereum Provider custom errors must provide single object argument.");
  });

  it("throws if the value is invalid", () => {
    expect(() => {
      // @ts-expect-error Invalid input
      providerErrors.custom({ code: 4009, message: 2 });
    }).toThrow('"message" must be a nonempty string');

    expect(() => {
      providerErrors.custom({ code: 4009, message: "" });
    }).toThrow('"message" must be a nonempty string');
  });
});

describe("rpcErrors.server", () => {
  it("throws on invalid input", () => {
    expect(() => {
      // @ts-expect-error Invalid input
      rpcErrors.server("bar");
    }).toThrow("Ethereum RPC Server errors must provide single object argument.");

    expect(() => {
      // @ts-expect-error Invalid input
      rpcErrors.server({ code: "bar" });
    }).toThrow('"code" must be an integer such that: -32099 <= code <= -32005');

    expect(() => {
      rpcErrors.server({ code: 1 });
    }).toThrow('"code" must be an integer such that: -32099 <= code <= -32005');
  });

  it("returns appropriate value", () => {
    const error = rpcErrors.server({
      code: SERVER_ERROR_CODE,
      data: { ...dummyData },
    });

    expect(error.code <= -32000 && error.code >= -32099).toBe(true);
    expect(error.message).toBe(JSON_RPC_SERVER_ERROR_MESSAGE);
  });
});

describe("rpcErrors", () => {
  Object.entries(rpcErrors)
    .filter(([key]) => key !== "server")
    .forEach(([key, value]) => {
      it(`${key} returns appropriate value`, () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createError = value as any;
        const error = createError({
          message: null,
          data: { ...dummyData },
        });
        // @ts-expect-error TypeScript does not like indexing into this with the key
        const rpcCode = errorCodes.rpc[key];
        expect(Object.values(errorCodes.rpc).includes(error.code) || (error.code <= -32000 && error.code >= -32099)).toBe(true);
        expect(error.code).toBe(rpcCode);
        expect(error.message).toBe(getMessageFromCode(rpcCode));
      });
    });

  Object.entries(rpcErrors)
    .filter(([key]) => key !== "server")
    .forEach(([key, value]) => {
      it(`${key} propagates data.cause if set`, () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createError = value as any;
        const error = createError({
          message: null,
          data: { ...dummyDataWithCause },
        });
        // @ts-expect-error TypeScript does not like indexing into this with the key
        const rpcCode = errorCodes.rpc[key];
        expect(error.message).toBe(getMessageFromCode(rpcCode));
        expect(error.cause.message).toBe(dummyMessage);
      });
    });

  it("serializes a cause", () => {
    const error = rpcErrors.invalidInput({
      data: {
        foo: "bar",
        cause: new Error("foo"),
      },
    });

    const serializedError = error.serialize();
    expect(serializedError.data).toBeTruthy();
    expect(isPlainObject(serializedError.data)).toBe(true);

    expect(!((serializedError.data as { cause?: unknown }).cause instanceof Error)).toBe(true);
    expect((serializedError.data as { foo: string; cause: Error }).foo).toBe("bar");
    expect((serializedError.data as { foo: string; cause: Error }).cause.message).toBe("foo");
  });

  it("serializes a non-Error-instance cause", () => {
    const error = rpcErrors.invalidInput({
      data: {
        foo: "bar",
        cause: "foo",
      },
    });

    const serializedError = error.serialize();
    expect(serializedError.data).toBeTruthy();
    expect(isPlainObject(serializedError.data)).toBe(true);

    expect(!((serializedError.data as { cause?: unknown }).cause instanceof Error)).toBe(true);
    expect(serializedError.data).toStrictEqual({
      foo: "bar",
      cause: "foo",
    });
  });
});

describe("providerErrors", () => {
  Object.entries(providerErrors)
    .filter(([key]) => key !== "custom")
    .forEach(([key, value]) => {
      it(`${key} returns appropriate value`, () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createError = value as any;
        const error = createError({
          message: null,
          data: { ...dummyData },
        });
        // @ts-expect-error TypeScript does not like indexing into this with the key
        const providerCode = errorCodes.provider[key];
        expect(error.code >= 1000 && error.code < 5000).toBe(true);
        expect(error.code).toBe(providerCode);
        expect(error.message).toBe(getMessageFromCode(providerCode));
      });
    });

  Object.entries(providerErrors)
    .filter(([key]) => key !== "custom")
    .forEach(([key, value]) => {
      it(`${key} propagates data.cause if set`, () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createError = value as any;
        const error = createError({
          message: null,
          data: { ...dummyDataWithCause },
        });
        // @ts-expect-error TypeScript does not like indexing into this with the key
        const providerCode = errorCodes.provider[key];
        expect(error.message).toBe(getMessageFromCode(providerCode));
        expect(error.cause.message).toBe(dummyMessage);
      });
    });

  it("custom returns appropriate value", () => {
    const error = providerErrors.custom({
      code: CUSTOM_ERROR_CODE,
      message: CUSTOM_ERROR_MESSAGE,
      data: { ...dummyData },
    });
    expect(error.code >= 1000 && error.code < 5000).toBe(true);
    expect(error.code).toBe(CUSTOM_ERROR_CODE);
    expect(error.message).toBe(CUSTOM_ERROR_MESSAGE);
  });

  it("serializes a cause", () => {
    const error = providerErrors.unauthorized({
      data: {
        foo: "bar",
        cause: new Error("foo"),
      },
    });

    const serializedError = error.serialize();
    expect(serializedError.data).toBeTruthy();
    expect(isPlainObject(serializedError.data)).toBe(true);

    expect(!((serializedError.data as { cause?: unknown }).cause instanceof Error)).toBe(true);
    expect((serializedError.data as { foo: string; cause: Error }).foo).toBe("bar");
    expect((serializedError.data as { foo: string; cause: Error }).cause.message).toBe("foo");
  });

  it("serializes a non-Error-instance cause", () => {
    const error = providerErrors.unauthorized({
      data: {
        foo: "bar",
        cause: "foo",
      },
    });

    const serializedError = error.serialize();
    expect(serializedError.data).toBeTruthy();
    expect(isPlainObject(serializedError.data)).toBe(true);

    expect(!((serializedError.data as { cause?: unknown }).cause instanceof Error)).toBe(true);
    expect(serializedError.data).toStrictEqual({
      foo: "bar",
      cause: "foo",
    });
  });
});

describe("SerializableError", () => {
  describe("constructor", () => {
    it("creates an error with code and message", () => {
      const error = new SerializableError({ code: -32600, message: "Invalid Request" });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SerializableError);
      expect(error.code).toBe(-32600);
      expect(error.message).toBe("Invalid Request");
    });

    it("creates an error with code, message, and data", () => {
      const data = { foo: "bar", count: 42 };
      const error = new SerializableError({ code: -32603, message: "Internal error", data });
      expect(error.code).toBe(-32603);
      expect(error.message).toBe("Internal error");
      expect(error.data).toStrictEqual(data);
    });

    it("leaves data as undefined when data is not provided", () => {
      const error = new SerializableError({ code: -32600, message: "Invalid Request" });
      expect(error.data).toBeUndefined();
    });

    it("sets data when explicitly provided as null", () => {
      const error = new SerializableError({ code: -32600, message: "Invalid Request", data: null });
      expect(error.data).toBeNull();
    });

    it("sets data when provided as an empty object", () => {
      const error = new SerializableError({ code: -32600, message: "Invalid Request", data: {} });
      expect(error.data).toStrictEqual({});
    });

    it("sets data when provided as a primitive value", () => {
      const error = new SerializableError({ code: -32600, message: "Invalid Request", data: "some string" });
      expect(error.data).toBe("some string");
    });

    it("throws if code is not an integer", () => {
      expect(() => new SerializableError({ code: 1.5, message: "test" })).toThrow("code must be an integer");
    });

    it("throws if code is NaN", () => {
      expect(() => new SerializableError({ code: NaN, message: "test" })).toThrow("code must be an integer");
    });

    it("throws if code is Infinity", () => {
      expect(() => new SerializableError({ code: Infinity, message: "test" })).toThrow("code must be an integer");
    });

    it("throws if message is an empty string", () => {
      expect(() => new SerializableError({ code: -32600, message: "" })).toThrow("message must be string");
    });

    it("throws if message is not a string", () => {
      // @ts-expect-error Testing invalid input
      expect(() => new SerializableError({ code: -32600, message: 123 })).toThrow("message must be string");
    });

    it("throws if message is null", () => {
      expect(() => new SerializableError({ code: -32600, message: null as unknown as string })).toThrow("message must be string");
    });

    it("throws if message is undefined", () => {
      expect(() => new SerializableError({ code: -32600, message: undefined as unknown as string })).toThrow("message must be string");
    });
  });

  describe("toString", () => {
    it("returns a JSON string with code, message, data, and stack", () => {
      const error = new SerializableError({ code: -32600, message: "Invalid Request", data: { foo: "bar" } });
      const parsed = JSON.parse(error.toString());
      expect(parsed.code).toBe(-32600);
      expect(parsed.message).toBe("Invalid Request");
      expect(parsed.data).toStrictEqual({ foo: "bar" });
      expect(parsed.stack).toBeDefined();
      expect(typeof parsed.stack).toBe("string");
    });

    it("returns a JSON string without data when data is not set", () => {
      const error = new SerializableError({ code: -32600, message: "Invalid Request" });
      const parsed = JSON.parse(error.toString());
      expect(parsed.code).toBe(-32600);
      expect(parsed.message).toBe("Invalid Request");
      expect(parsed).not.toHaveProperty("data");
    });

    it("produces deterministic output (json-stable-stringify)", () => {
      const error = new SerializableError({ code: -32600, message: "test", data: { z: 1, a: 2 } });
      const str = error.toString();
      // json-stable-stringify sorts keys alphabetically
      const keyOrder = [...str.matchAll(/"(code|data|message|stack)"/g)].map((m) => m[1]);
      expect(keyOrder).toStrictEqual(["code", "data", "message", "stack"]);
    });
  });

  describe("inheritance", () => {
    it("is an instance of Error", () => {
      const error = new SerializableError({ code: -32600, message: "test" });
      expect(error instanceof Error).toBe(true);
    });

    it("has a stack trace", () => {
      const error = new SerializableError({ code: -32600, message: "test" });
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
      expect(error.stack).toContain("test");
    });

    it("can be caught as an Error", () => {
      expect(() => {
        throw new SerializableError({ code: -32600, message: "catch me" });
      }).toThrow("catch me");
    });

    it("name is 'Error' by default (inherits from Error)", () => {
      const error = new SerializableError({ code: -32600, message: "test" });
      expect(error.name).toBe("Error");
    });
  });
});
