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
  readyState: ReadableAtom<number>;
  loadState: ReadableAtom<LoadState>;

  /** The one UI atom: shared React state that is not on the element. */
  timeDisplay: Atom<TimeDisplay>;

  send: (action: SideEffectAction) => void;
  /**
   * Suspends the `lastAudibleVolume` memory for the duration of a volume drag and
   * returns its release. Counted, so overlapping holds are safe, and idempotent
   * per release, so a double call cannot unbalance the count.
   *
   * It suppresses; it never writes — the volume just before a grab is already in
   * the memory — so the projection invariant holds: `syncFromElement` is still
   * the only writer.
   */
  holdAudibleVolume: () => () => void;
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
    readyState: atom(0),
    loadState: atom<LoadState>("loading"),
  };

  const timeDisplay = atom<TimeDisplay>("elapsed");

  // Closure variables, not atoms: nothing subscribes to either, and an atom would
  // buy a `set` handle the projection invariant then has to forbid.
  let element: HTMLAudioElement | null = null;
  let audibleVolumeHolds = 0;

  const holdAudibleVolume = () => {
    audibleVolumeHolds += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      audibleVolumeHolds -= 1;
    };
  };

  const attach = (nextElement: HTMLAudioElement) => {
    element = nextElement;
    const detach = syncFromElement(nextElement, atoms, {
      isAudibleVolumePinned: () => audibleVolumeHolds > 0,
    });
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
    readyState: readable(atoms.readyState),
    loadState: readable(atoms.loadState),
    timeDisplay,
    send,
    holdAudibleVolume,
    attach,
  };
}
