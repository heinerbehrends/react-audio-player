import { normalizeRateRange, type RateRange } from "../AudioElement/rateRange";
import { createControls, type AudioPlayerControls } from "./createControls";
import { derivePlayerState, type AudioPlayerState } from "./playerState";
import { audioErrorOf } from "./derived";
import { atom, readable, type ReadableAtom } from "./atom";
import {
  HANDLERS,
  syncFromElement,
  type LoadState,
  type ProjectionAtoms,
} from "./syncFromElement";

export type PlayerStore = {
  // Read-only projections of the audio element. Only `syncFromElement` writes
  // them, and only `attach` reaches it.
  currentTime: ReadableAtom<number>;
  currentSecond: ReadableAtom<number>;
  duration: ReadableAtom<number>;
  isLive: ReadableAtom<boolean>;
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
   * so `send` writes it. It clears when a `play()` finally succeeds, and
   * deliberately not on a `src` change: an autoplay block outlives the track
   * that revealed it.
   */
  playbackError: ReadableAtom<string | null>;

  /** The attached element, for an opt-in part that reads it directly. */
  element: ReadableAtom<HTMLAudioElement | null>;

  /**
   * The player's `rateRange`, normalised. Held here rather than in the config
   * context because the write path clamps to it, and the rate slider reads
   * the same atom for its range, so the two cannot disagree.
   */
  rateRange: ReadableAtom<RateRange>;
  /** Replaces `rateRange` from the prop. A no-op when both ends are unchanged. */
  setRateRange: (range: readonly [number, number] | undefined) => void;

  /** The control methods, built once: every write to the element goes through them. */
  controls: AudioPlayerControls;
  /** `useAudioPlayer()`'s object, read once outside a render: what a shortcut receives. */
  read: () => AudioPlayerState & AudioPlayerControls;
  /**
   * Freezes `lastAudibleVolume` for the duration of a volume drag and returns
   * its release. Holds are counted, so overlapping ones are safe, and each
   * release is idempotent. It only suppresses writes, never makes them.
   */
  holdAudibleVolume: () => () => void;
  /** Binds the store to an element and returns the detach function. */
  attach: (element: HTMLAudioElement) => () => void;
  /**
   * Called after a `src` swap: plays the new track if playback was wanted
   * before it, which a swap does not change. Wanted means a `play` sent or
   * observed and not since revoked by a pause. The pause at a natural end does
   * not revoke it, so a playlist advanced from `onEnded` carries on (F13), and
   * so does any later swap until a pause (F14).
   */
  continuePlayback: () => void;
};

export type PlayerStoreOptions = {
  /** The `rateRange` prop at creation, so the first render already has it. */
  rateRange?: readonly [number, number] | undefined;
};

export function createPlayerStore({
  rateRange: initialRateRange,
}: PlayerStoreOptions = {}): PlayerStore {
  const atoms: ProjectionAtoms = {
    currentTime: atom(0),
    currentSecond: atom(0),
    duration: atom(0),
    isLive: atom(false),
    volume: atom(1),
    muted: atom(false),
    lastAudibleVolume: atom(1),
    rate: atom(1),
    paused: atom(true),
    readyState: atom(0),
    mediaErrorCode: atom<number | null>(null),
    loadState: atom<LoadState>("loading"),
  };

  // Not atoms: nothing subscribes to either, and an atom would come with a
  // `set` handle that the read-only projections then have to forbid.
  // `elementAtom` publishes the element for the parts that subscribe.
  let element: HTMLAudioElement | null = null;
  const elementAtom = atom<HTMLAudioElement | null>(null);
  let audibleVolumeHolds = 0;
  // Whether the user wants playback, recorded when a command is sent rather
  // than when the element's event arrives: the `play` event is a task late, and
  // a click that plays and swaps the track commits the swap before it.
  let playWanted = false;

  const holdAudibleVolume = () => {
    audibleVolumeHolds += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      audibleVolumeHolds -= 1;
    };
  };

  // Playback started or stopped by something other than `send`: native
  // controls, `autoplay`, a consumer holding the element. Each handler checks the
  // element first, so an event made stale by a later command changes nothing.
  // A swap fires no `pause` (measured in Chrome and Firefox), so it leaves the
  // intent alone. Firefox's `ended` on a paused seek to the end fires no
  // `pause` either (B4), so a paused player stays unwanted.
  const onPlay = () => {
    if (element && !element.paused) playWanted = true;
  };
  const onPause = () => {
    if (element && element.paused && !element.ended) playWanted = false;
  };

  const attach = (nextElement: HTMLAudioElement) => {
    element = nextElement;
    elementAtom.set(nextElement);
    playWanted = !nextElement.paused;
    const detach = syncFromElement(nextElement, atoms, {
      isAudibleVolumePinned: () => audibleVolumeHolds > 0,
    });
    nextElement.addEventListener("play", onPlay);
    nextElement.addEventListener("pause", onPause);
    return () => {
      detach();
      nextElement.removeEventListener("play", onPlay);
      nextElement.removeEventListener("pause", onPause);
      if (element === nextElement) {
        element = null;
        elementAtom.set(null);
      }
    };
  };

  const playbackError = atom<string | null>(null);

  const rateRange = atom<RateRange>(normalizeRateRange(initialRateRange));
  const setRateRange = (range: readonly [number, number] | undefined) => {
    const next = normalizeRateRange(range);
    const current = rateRange.get();
    // Compared by value: a fresh object per call would defeat the atom's
    // `Object.is` bail-out and re-render the slider on every effect run.
    if (
      next.minValue === current.minValue &&
      next.maxValue === current.maxValue
    ) {
      return;
    }
    rateRange.set(next);
    // Now, not at the next write: the slider would draw it past its end.
    const rate = element?.playbackRate;
    if (rate !== undefined && (rate < next.minValue || rate > next.maxValue)) {
      controls.setRate(rate);
    }
  };

  const controls = createControls({
    element: () => element,
    isSeekable: () => atoms.duration.get() > 0,
    lastAudibleVolume: () => atoms.lastAudibleVolume.get(),
    rateRange: () => rateRange.get(),
    project: () => {
      if (!element) return;
      HANDLERS.volumechange(element, atoms, audibleVolumeHolds > 0);
      HANDLERS.ratechange(element, atoms);
    },
    playWanted: () => playWanted,
    setPlayWanted: (wanted) => {
      playWanted = wanted;
    },
    settlePlay: (started) =>
      started.then(
        () => playbackError.set(null),
        (rejection: unknown) => {
          const name =
            (rejection as { name?: string } | null | undefined)?.name ??
            "UnknownError";
          // A `pause()` or `src` change overtook the request — a
          // double-click or a held key. The user's intent was honoured, so
          // there is nothing to report.
          if (name === "AbortError") return;
          // An autoplay refusal would only be repeated by the next swap. Any
          // other — a 404's `NotSupportedError` — is the track's, so the
          // next one plays.
          if (name === "NotAllowedError") playWanted = false;
          playbackError.set(name);
        },
      ),
  });

  return {
    currentTime: readable(atoms.currentTime),
    currentSecond: readable(atoms.currentSecond),
    duration: readable(atoms.duration),
    isLive: readable(atoms.isLive),
    volume: readable(atoms.volume),
    muted: readable(atoms.muted),
    lastAudibleVolume: readable(atoms.lastAudibleVolume),
    rate: readable(atoms.rate),
    paused: readable(atoms.paused),
    readyState: readable(atoms.readyState),
    mediaErrorCode: readable(atoms.mediaErrorCode),
    loadState: readable(atoms.loadState),
    playbackError: readable(playbackError),
    element: readable(elementAtom),
    rateRange: readable(rateRange),
    setRateRange,
    controls,
    read: () => ({
      ...derivePlayerState({
        duration: atoms.duration.get(),
        isLive: atoms.isLive.get(),
        paused: atoms.paused.get(),
        volume: atoms.volume.get(),
        muted: atoms.muted.get(),
        rate: atoms.rate.get(),
        loadState: atoms.loadState.get(),
        readyState: atoms.readyState.get(),
        error: audioErrorOf(atoms.mediaErrorCode.get(), playbackError.get()),
      }),
      ...controls,
    }),
    holdAudibleVolume,
    attach,
    continuePlayback: () => {
      if (playWanted) controls.play();
    },
  };
}
