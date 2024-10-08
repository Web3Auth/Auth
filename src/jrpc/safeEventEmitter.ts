/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "events";
import TypedEventEmitter, { EventMap } from "typed-emitter";

function safeApply<T, A extends any[]>(handler: (this: T, ...handlerArgs: A) => void, context: T, args: A): void {
  try {
    Reflect.apply(handler, context, args);
  } catch (err) {
    // Throw error after timeout so as not to interrupt the stack
    setTimeout(() => {
      throw err;
    });
  }
}

function arrayClone<T>(arr: T[]): T[] {
  const n = arr.length;
  const copy = new Array(n);
  for (let i = 0; i < n; i += 1) {
    copy[i] = arr[i];
  }
  return copy;
}

export class SafeEventEmitter<T extends EventMap = EventMap> extends (EventEmitter as { new <E extends EventMap>(): TypedEventEmitter<E> })<T> {
  emit<E extends keyof T>(type: E, ...args: Parameters<T[E]>): boolean {
    let doError = type === "error";

    const events: EventMap = (this as any)._events;
    if (events !== undefined) {
      doError = doError && events.error === undefined;
    } else if (!doError) {
      return false;
    }

    // If there is no 'error' event listener then throw.
    if (doError) {
      let er;
      if (args.length > 0) {
        [er] = args;
      }
      if (er instanceof Error) {
        // Note: The comments on the `throw` lines are intentional, they show
        // up in Node's output if this results in an unhandled exception.
        throw er; // Unhandled 'error' event
      }
      // At least give some kind of context to the user
      const err = new Error(`Unhandled error.${er ? ` (${er.message})` : ""}`);
      (err as any).context = er;
      throw err; // Unhandled 'error' event
    }

    const handler = events[type as string];

    if (handler === undefined) {
      return false;
    }

    if (typeof handler === "function") {
      safeApply(handler, this, args);
    } else {
      const len = (handler as any[]).length;
      const listeners = arrayClone(handler as any[]);
      for (let i = 0; i < len; i += 1) {
        safeApply(listeners[i], this, args);
      }
    }

    return true;
  }
}
