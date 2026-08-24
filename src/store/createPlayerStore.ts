import { handleSideEffect } from "../AudioElement/handleSideEffect";
import type { SideEffectAction } from "../AudioElement/sideEffectActions";
import { atom, readable, type Atom, type ReadableAtom } from "./atom";
import {
  syncFromElement,
  type LoadState,
  type ProjectionAtoms,
} from "./syncFromElement";

export type TimeDisplay = "elapsed" | "remaining";

export type PlayerStore = {
  // Projections of the audio element. Read-only: nothing writes them except
  // `syncFromElement`, reached through `attach`.
  currentTime: ReadableAtom<number>;
  currentSecond: ReadableAtom<number>;
  duration: ReadableAtom<number>;
  volume: ReadableAtom<number>;
  muted: ReadableAtom<boolean>;
  lastAudibleVolume: ReadableAtom<number>;
  rate: ReadableAtom<number>;
  paused: ReadableAtom<boolean>;
  loadState: ReadableAtom<LoadState>;

  /** The one UI atom: shared React state that is not on the element. */
  timeDisplay: Atom<TimeDisplay>;

  send: (action: SideEffectAction) => void;
  /** Sets the element, primes every atom off it, subscribes, returns the detach. */
  attach: (element: HTMLAudioElement) => () => void;
};

export function createPlayerStore(): PlayerStore {
  const atoms: ProjectionAtoms = {
    currentTime: atom(0),
    currentSecond: atom(0),
    duration: atom(0),
    volume: atom(1),
    muted: atom(false),
    lastAudibleVolume: atom(1),
    rate: atom(1),
    paused: atom(true),
    loadState: atom<LoadState>("loading"),
  };

  const timeDisplay = atom<TimeDisplay>("elapsed");

  // A closure variable, not an atom: nothing subscribes to it, and an atom would
  // buy a `set` handle the projection invariant then has to forbid.
  let element: HTMLAudioElement | null = null;

  const attach = (nextElement: HTMLAudioElement) => {
    element = nextElement;
    const detach = syncFromElement(nextElement, atoms);
    return () => {
      detach();
      if (element === nextElement) {
        element = null;
      }
    };
  };

  const send = (action: SideEffectAction) =>
    handleSideEffect(action, element, {
      lastAudibleVolume: atoms.lastAudibleVolume.get(),
    });

  return {
    currentTime: readable(atoms.currentTime),
    currentSecond: readable(atoms.currentSecond),
    duration: readable(atoms.duration),
    volume: readable(atoms.volume),
    muted: readable(atoms.muted),
    lastAudibleVolume: readable(atoms.lastAudibleVolume),
    rate: readable(atoms.rate),
    paused: readable(atoms.paused),
    loadState: readable(atoms.loadState),
    timeDisplay,
    send,
    attach,
  };
}
