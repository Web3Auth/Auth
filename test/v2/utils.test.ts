import { describe, expect, it } from "vitest";

import type { JsonRpcParams } from "../../src/jrpc/v2/v2interfaces";
import {
  entriesFromKeyValues,
  getUniqueId,
  hasProperty,
  isInstance,
  isIterable,
  isNotification,
  isObject,
  isRequest,
  isValidJson,
  JsonRpcEngineError,
  stringify,
} from "../../src/jrpc/v2/v2utils";

describe("v2/utils", () => {
  describe("isObject", () => {
    it("returns true for non-null objects", () => {
      expect(isObject({})).toBe(true);
      expect(isObject(new Date())).toBe(true);
    });

    it("returns false for non-objects", () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(1)).toBe(false);
      expect(isObject("test")).toBe(false);
      expect(isObject([])).toBe(false);
    });
  });

  describe("hasProperty", () => {
    it("returns true when key exists", () => {
      const value = { a: 1 };
      expect(hasProperty(value, "a")).toBe(true);
    });

    it("returns false when key is not on the object", () => {
      const value = { a: 1 };
      expect(hasProperty(value, "b")).toBe(false);
    });

    it("returns false for non-objects", () => {
      expect(hasProperty(null, "a")).toBe(false);
      expect(hasProperty(1, "a")).toBe(false);
    });
  });

  describe("isValidJson", () => {
    it("accepts valid JSON values", () => {
      expect(isValidJson(null)).toBe(true);
      expect(isValidJson(true)).toBe(true);
      expect(isValidJson(123)).toBe(true);
      expect(isValidJson("test")).toBe(true);
      expect(isValidJson([1, "a", false])).toBe(true);
      expect(isValidJson({ a: 1, b: [2, 3] })).toBe(true);
    });

    it("rejects non-JSON values", () => {
      const notJson = (): void => undefined;

      expect(isValidJson(undefined)).toBe(false);
      expect(isValidJson(Symbol("s"))).toBe(false);
      expect(isValidJson(notJson)).toBe(false);
      expect(isValidJson({ a: undefined })).toBe(false);
    });
  });

  describe("isRequest/isNotification", () => {
    it("detects requests by id", () => {
      const params: JsonRpcParams = [];
      const request = { jsonrpc: "2.0" as const, method: "test", params, id: 1 };

      expect(isRequest(request)).toBe(true);
      expect(isNotification(request)).toBe(false);
    });

    it("detects notifications without id", () => {
      const params: JsonRpcParams = [];
      const notification = { jsonrpc: "2.0" as const, method: "test", params };

      expect(isRequest(notification)).toBe(false);
      expect(isNotification(notification)).toBe(true);
    });
  });

  describe("stringify", () => {
    it("pretty prints JSON with 2-space indentation", () => {
      expect(stringify({ a: 1 })).toBe('{\n  "a": 1\n}');
    });
  });

  describe("isInstance", () => {
    it("checks for symbol on prototype chain", () => {
      const symbol = Symbol("test");
      const proto = { [symbol]: true };
      const value = Object.create(proto);

      expect(isInstance(value, symbol)).toBe(true);
      expect(isInstance({}, symbol)).toBe(false);
    });
  });

  describe("JsonRpcEngineError", () => {
    it("detects instances across realms", () => {
      const error = new JsonRpcEngineError("test");
      expect(JsonRpcEngineError.isInstance(error)).toBe(true);
    });
  });

  describe("getUniqueId", () => {
    it("returns unique values within uint32 range", () => {
      const first = getUniqueId();
      const second = getUniqueId();

      expect(first).not.toBe(second);
      expect(first).toBeGreaterThanOrEqual(0);
      expect(first).toBeLessThanOrEqual(4_294_967_295);
      expect(second).toBeGreaterThanOrEqual(0);
      expect(second).toBeLessThanOrEqual(4_294_967_295);
    });
  });

  describe("isIterable", () => {
    it("detects iterables", () => {
      expect(isIterable([])).toBe(true);
      expect(isIterable(new Map())).toBe(true);
    });

    it("returns false for non-iterables", () => {
      expect(isIterable({})).toBe(false);
    });
  });

  describe("entriesFromKeyValues", () => {
    it("includes symbol keys", () => {
      const symbol = Symbol("key");
      const value = { a: 1, [symbol]: "b" };

      const entries = entriesFromKeyValues(value);

      expect(entries).toContainEqual(["a", 1]);
      expect(entries).toContainEqual([symbol, "b"]);
      expect(entries).toHaveLength(2);
    });
  });
});
