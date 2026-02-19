import { JRPCNotification, JRPCParams, JRPCRequest, Json } from "../interfaces";
import type { JRPCEngineV2 } from "./jrpcEngineV2";
import type { MiddlewareContext } from "./MiddlewareContext";

export type NonEmptyArray<Type> = [Type, ...Type[]];

export type JsonRpcCall<Params extends JRPCParams = JRPCParams> = JRPCNotification<Params> | JRPCRequest<Params>;

/**
 * An unholy incantation that converts a union of object types into an
 * intersection of object types.
 *
 * @example
 * type A = { a: string } | { b: number };
 * type B = UnionToIntersection<A>; // { a: string } & { b: number }
 */
export type UnionToIntersection<Union> = (Union extends never ? never : (k: Union) => void) extends (k: infer Args) => void ? Args : never;

/**
 * Infer the KeyValues type from a {@link MiddlewareContext}.
 */
export type InferKeyValues<Type> = Type extends MiddlewareContext<infer KeyValues> ? KeyValues : never;

/**
 * Simplifies an object type by "merging" its properties.
 *
 * - Expands intersections into a single object type.
 * - Forces mapped/conditional results to resolve into a readable shape.
 * - No runtime effect; purely a type-level normalization.
 *
 * @example
 * type A = { a: string } & { b: number };
 * type B = Simplify<A>; // { a: string; b: number }
 */
type Simplify<Type> = Type extends infer Object ? { [Key in keyof Object]: Object[Key] } : never;

/**
 * Rejects record types that contain any `never`-valued property.
 *
 * If any property of `T` resolves to `never`, the result is `never`; otherwise it returns `T` unchanged.
 * Useful as a guard to ensure computed/merged record types didn't collapse any fields to `never`.
 *
 * @example
 * type A = ExcludeNever<{ a: string; b: never }>; // never
 * type B = ExcludeNever<{ a: string; b: number }>; // { a: string; b: number }
 */
type ExcludeNever<Type extends Record<PropertyKey, unknown>> = {
  [Key in keyof Type]-?: [Type[Key]] extends [never] ? Key : never;
}[keyof Type] extends never
  ? Type
  : never;

/**
 * Merge a union of {@link MiddlewareContext}s into a single {@link MiddlewareContext}
 * supertype.
 *
 * @param Contexts - The union of {@link MiddlewareContext}s to merge.
 * @returns The merged {@link MiddlewareContext} supertype.
 * @example
 * type A = MiddlewareContext<{ a: string }> | MiddlewareContext<{ b: number }>;
 * type B = MergeContexts<A>; // MiddlewareContext<{ a: string, b: number }>
 */
export type MergeContexts<Contexts extends ContextConstraint> =
  ExcludeNever<Simplify<UnionToIntersection<InferKeyValues<Contexts>>>> extends never
    ? never
    : MiddlewareContext<ExcludeNever<Simplify<UnionToIntersection<InferKeyValues<Contexts>>>>>;

/**
 * A constraint for {@link MiddlewareContext} generic parameters.
 */
// Non-polluting `any` constraint.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContextConstraint = MiddlewareContext<any>;

/**
 * The empty context type, i.e. `MiddlewareContext<{}>`.
 */
// The empty object type is literally an empty object in this context.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type EmptyContext = MiddlewareContext<{}>;

// Helper to forbid `id` on notifications
export type WithoutId<Request extends JsonRpcCall> = Request & { id?: never };

// Helper to enable JsonRpcCall overload of handle()
export type MixedParam<Request extends JsonRpcCall> = [Extract<Request, JRPCRequest>] extends [never]
  ? never
  : [Extract<Request, JRPCNotification>] extends [never]
    ? never
    : Extract<Request, JRPCRequest> | WithoutId<Extract<Request, JRPCNotification>>;

export type ResultConstraint<Request extends JsonRpcCall> = Request extends JRPCRequest ? Json : void;

export type Next<Request extends JsonRpcCall> = (request?: Readonly<Request>) => Promise<Readonly<ResultConstraint<Request>> | undefined>;

export type MiddlewareParams<Request extends JsonRpcCall = JsonRpcCall, Context extends ContextConstraint = MiddlewareContext> = {
  request: Readonly<Request>;
  context: Context;
  next: Next<Request>;
};

export type JRPCMiddlewareV2<
  Request extends JsonRpcCall = JsonRpcCall,
  Result extends ResultConstraint<Request> = ResultConstraint<Request>,
  Context extends ContextConstraint = MiddlewareContext,
> = (params: MiddlewareParams<Request, Context>) => Readonly<Result> | undefined | Promise<Readonly<Result> | undefined>;

export type RequestState<Request extends JsonRpcCall> = {
  request: Request;
  result: Readonly<ResultConstraint<Request>> | undefined;
};

/**
 * The options for the JSON-RPC request/notification handling operation.
 */
export type HandleOptions<Context extends ContextConstraint> = {
  context?: Context | InferKeyValues<Context>;
};

export type ConstructorOptions<Request extends JsonRpcCall, Context extends MiddlewareContext> = {
  middleware: JRPCMiddlewareV2<Request, ResultConstraint<Request>, Context>[];
};

/**
 * The request type of a middleware.
 */
// Non-polluting `any` constraint.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestOf<Middleware> = Middleware extends JRPCMiddlewareV2<infer Request, ResultConstraint<infer Request>, any> ? Request : never;

// Non-polluting `any` constraint.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContextOf<Middleware> = Middleware extends JRPCMiddlewareV2<any, ResultConstraint<any>, infer C> ? C : never;

/**
 * A constraint for {@link JRPCMiddlewareV2} generic parameters.
 */
// Non-polluting `any` constraint.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type MiddlewareConstraint = JRPCMiddlewareV2<any, ResultConstraint<any>, MiddlewareContext<any>>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * The context supertype of a middleware type.
 */
export type MergedContextOf<Middleware extends MiddlewareConstraint> = MergeContexts<ContextOf<Middleware>>;

declare const INVALID_ENGINE: unique symbol;

/**
 * An internal type for invalid engines that explains why the engine is invalid.
 *
 * @template Message - The message explaining why the engine is invalid.
 */
export type InvalidEngine<Message extends string> = { [INVALID_ENGINE]: Message };

// Only permit primitive values as hard-coded scaffold middleware results.
type JsonPrimitive = string | number | boolean | null;

/**
 * A handler for a scaffold middleware function.
 *
 * @template Params - The parameters of the request.
 * @template Result - The result of the request.
 * @template Context - The context of the request.
 * @returns A JSON-RPC middleware function or a primitive JSON value.
 */
export type ScaffoldMiddlewareHandler<
  Params extends JRPCParams,
  Result extends ResultConstraint<JRPCRequest<Params>>,
  Context extends ContextConstraint,
> = JRPCMiddlewareV2<JRPCRequest<Params>, Result, Context> | JsonPrimitive;

/**
 * A record of RPC method handler functions or hard-coded results, keyed to particular method names.
 * Only primitive JSON values are permitted as hard-coded results.
 */
export type MiddlewareScaffold<Context extends ContextConstraint = MiddlewareContext> = Record<
  string,
  ScaffoldMiddlewareHandler<JRPCParams, Json, Context>
>;

// Matching the default implementation of klona, this type:
// - Removes readonly modifiers
// - Excludes non-enumerable / symbol properties
export type DeepCloned<Type> = Type extends readonly (infer ArrayType)[]
  ? DeepCloned<ArrayType>[]
  : Type extends object
    ? { -readonly [Key in keyof Type & (string | number)]: DeepCloned<Type[Key]> }
    : Type;

export type OnError = (error: unknown) => void;

export type Options<Middleware extends MiddlewareConstraint> = {
  onError?: OnError;
} & (
  | {
      engine: ReturnType<typeof JRPCEngineV2.create<Middleware>>;
    }
  | {
      middleware: NonEmptyArray<Middleware>;
    }
);

/**
 * The most minimally conformant request object that we will accept.
 */
export type MinimalRequest = {
  method: string;
  params?: JRPCParams;
} & Record<string, unknown>;
