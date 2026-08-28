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
  // Read-only projections of the audio element. Only `syncFromElement` writes
  // them, and only `attach` reaches it.
  currentTime: ReadableAtom<number>;
  currentSecond: ReadableAtom<number>;
  duration: ReadableAtom<number>;
  volume: ReadableAtom<number>;
  muted: ReadableAtom<boolean>;
  lastAudibleVolume: ReadableAtom<number>;
  rate: ReadableAtom<number>;
  paused: ReadableAtom<boolean>;
  readyState: ReadableAtom<number>;
  mediaErrorCode: ReadableAtom<number | null>;
  loadState: ReadableAtom<LoadState>;

  /**
   * The name of the `DOMException` from the last refused `play()`, or `null`.
   *
   * Not a projection — there is no element property for "the browser said no" —
   * so `send` writes it, making it the second writable atom after
   * `timeDisplay`. It clears when a `play()` finally succeeds, and deliberately
   * not on a `src` change: an autoplay block outlives the track that revealed
   * it, and is only lifted by a user gesture.
   */
  playbackError: ReadableAtom<string | null>;

  /** The one writable atom: UI state with no counterpart on the element. */
  timeDisplay: Atom<TimeDisplay>;

  send: (action: SideEffectAction) => void;
  /**
   * Freezes `lastAudibleVolume` for the duration of a volume drag and returns
   * its release. Holds are counted, so overlapping ones are safe, and each
   * release is idempotent. It only suppresses writes, never makes them.
   */
  holdAudibleVolume: () => () => void;
  /** Binds the store to an element and returns the detach function. */
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
    mediaErrorCode: atom<number | null>(null),
    loadState: atom<LoadState>("loading"),
  };

  const timeDisplay = atom<TimeDisplay>("elapsed");

  // Not atoms: nothing subscribes to either, and an atom would come with a
  // `set` handle that the read-only projections then have to forbid.
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

  const playbackError = atom<string | null>(null);

  const send = (action: SideEffectAction) => {
    const started = handleSideEffect(action, element, {
      lastAudibleVolume: atoms.lastAudibleVolume.get(),
    });
    if (!started) return;

    started.then(
      () => playbackError.set(null),
      (rejection: unknown) => {
        const name =
          (rejection as { name?: string } | null | undefined)?.name ??
          "UnknownError";
        // `AbortError` means a `pause()` or `src` change overtook the request,
        // which is what a double-click or a held key produces. The user's
        // intent was honoured, so there is nothing to report.
        if (name === "AbortError") return;
        playbackError.set(name);
      },
    );
  };

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
    mediaErrorCode: readable(atoms.mediaErrorCode),
    loadState: readable(atoms.loadState),
    playbackError: readable(playbackError),
    timeDisplay,
    send,
    holdAudibleVolume,
    attach,
  };
}
