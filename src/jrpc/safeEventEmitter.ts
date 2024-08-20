/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from "events";
import type { default as TypedEmitter, EventMap } from "typed-emitter";

export class SafeEventEmitter<T extends EventMap = EventMap> extends (EventEmitter as { new <E extends EventMap>(): TypedEmitter<E> })<T> {
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

    super.emit(type, ...args);

    return true;
  }
}
