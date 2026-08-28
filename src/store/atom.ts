import { useSyncExternalStore } from "react";

/**
 * The read side of an atom. The `set` handle stays inside `createPlayerStore`'s
 * closure, reachable only through `attach`, so `syncFromElement` is the only
 * writer.
 */
export type ReadableAtom<T> = {
  get: () => T;
  subscribe: (listener: () => void) => () => void;
};

export type Atom<T> = ReadableAtom<T> & {
  set: (next: T) => void;
};

export function atom<T>(initial: T): Atom<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: T) => {
      // `Object.is`, not `===`: React compares snapshots with `Object.is` and the
      // two must never disagree. The bail-out makes the 1 Hz `currentSecond`
      // write free when the second has not changed.
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

/** Strips the `set` handle, so a projection cannot be written from outside. */
export function readable<T>(source: Atom<T>): ReadableAtom<T> {
  return { get: source.get, subscribe: source.subscribe };
}

/** `get` and `subscribe` are per-atom stable, so this never resubscribes. */
export function useStore<T>(source: ReadableAtom<T>): T {
  return useSyncExternalStore(source.subscribe, source.get, source.get);
}
