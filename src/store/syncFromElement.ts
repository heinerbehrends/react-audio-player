import type { Atom } from "./atom";

export type LoadState = "loading" | "ready" | "error";

/**
 * `HTMLMediaElement.HAVE_FUTURE_DATA`: the element has enough data to advance
 * playback. Below it, playback has not started or has stalled.
 */
export const HAVE_FUTURE_DATA = 3;

/** `HTMLMediaElement.HAVE_NOTHING`: no data at all, so nothing can play. */
export const HAVE_NOTHING = 0;

/**
 * `HTMLMediaElement.NETWORK_IDLE`: a source is chosen and nothing is being
 * fetched.
 */
export const NETWORK_IDLE = 1;

/** `MediaError.MEDIA_ERR_NETWORK`: the fetch failed after it had started. */
const MEDIA_ERR_NETWORK = 2;

/**
 * The write side of the projection atoms. Only `createPlayerStore` holds this
 * bundle, and it reaches `syncFromElement` only through `attach`.
 */
export type ProjectionAtoms = {
  currentTime: Atom<number>;
  currentSecond: Atom<number>;
  duration: Atom<number>;
  /**
   * Whether the source is a live stream: an unbounded duration, or `data-live`
   * on the element, which `track.live` sets (B11). Projected on its own
   * because `duration` reads `0` for it, which is also what it reads before
   * metadata, so downstream the two cannot be told apart (D4).
   */
  isLive: Atom<boolean>;
  volume: Atom<number>;
  muted: Atom<boolean>;
  lastAudibleVolume: Atom<number>;
  rate: Atom<number>;
  paused: Atom<boolean>;
  /**
   * The raw rung, projected so buffering can be derived rather than tracked. It
   * overlaps `loadState` — roughly `readyState >= 1` plus the error case — but
   * both are read off the same element at the same events, so they cannot
   * diverge.
   */
  readyState: Atom<number>;
  /**
   * `MediaError.code`, or `null` when the element is healthy. The code is
   * projected rather than the `MediaError` itself, which is an object and would
   * defeat the `Object.is` bail-out.
   */
  mediaErrorCode: Atom<number | null>;
  loadState: Atom<LoadState>;
};

/**
 * The subset of `HTMLMediaElement` this layer touches. Narrow enough that a
 * test can stub it instead of relying on jsdom audio.
 */
export type SyncableMediaElement = {
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  paused: boolean;
  readyState: number;
  networkState: number;
  error: MediaError | null;
  dataset: DOMStringMap;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

/**
 * `pinned` is true while a volume drag holds `lastAudibleVolume` still. Passed
 * in rather than read from an atom, so no handler ever reads the store.
 */
type SyncHandler = (
  element: SyncableMediaElement,
  atoms: ProjectionAtoms,
  pinned: boolean,
) => void;

export type SyncOptions = {
  isAudibleVolumePinned?: () => boolean;
};

/**
 * `duration` is `NaN` before metadata arrives and `Infinity` for a live stream.
 * Normalising on write means no consumer has to handle either.
 */
function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

const projectTime: SyncHandler = (element, atoms) => {
  atoms.currentTime.set(element.currentTime);
  atoms.currentSecond.set(Math.floor(element.currentTime));
};

/**
 * `duration` and `isLive` move together. A live stream reads `0`: `Infinity`,
 * which `finite()` erases, or `data-live` on a stream Firefox reports as a
 * finite, growing track (B11). `NaN` before metadata is not live.
 *
 * The attribute is read when the duration is, so toggling `track.live` on
 * the same `src` takes effect at the next `durationchange`.
 */
const projectDuration: SyncHandler = (element, atoms) => {
  const isLive =
    element.duration === Infinity || element.dataset["live"] !== undefined;
  atoms.duration.set(isLive ? 0 : finite(element.duration));
  atoms.isLive.set(isLive);
};

/** Never toggled: always read off the element. */
const projectPaused: SyncHandler = (element, atoms) => {
  atoms.paused.set(element.paused);
};

/**
 * Shared by every event that can move the rung. `Object.is` drops the writes
 * that did not move it, so `progress` firing every few hundred milliseconds
 * during a download wakes nobody.
 */
const projectReadyState: SyncHandler = (element, atoms) => {
  atoms.readyState.set(element.readyState);
};

/**
 * Whether a `MediaError` actually means the resource is unusable. The event
 * alone does not say so: Firefox on a machine that cannot open an audio output
 * device fires `error` with `MEDIA_ERR_DECODE` milliseconds after `play()`, then
 * plays the track to the end with `readyState` at `HAVE_ENOUGH_DATA`.
 *
 * `HAVE_NOTHING` is the test instead — an element holding data can still play
 * what it has. A 404 or an unsupported format reports `HAVE_NOTHING`, so the
 * case that must disable the controls still does.
 *
 * The exception is a network failure once playback has stopped on it, paused
 * or out of data: the element fetches nothing more. Chromium pauses before
 * `error`; Firefox plays out the buffer, then ends or stalls.
 */
function isUnusable(element: SyncableMediaElement): boolean {
  const { error } = element;
  if (error === null) return false;
  if (element.readyState === HAVE_NOTHING) return true;
  return (
    error.code === MEDIA_ERR_NETWORK &&
    (element.paused || element.readyState < HAVE_FUTURE_DATA)
  );
}

/** Latches the error when the element is unusable, and writes nothing else. */
const projectError: SyncHandler = (element, atoms) => {
  if (!isUnusable(element)) return;
  atoms.mediaErrorCode.set(element.error?.code ?? null);
  atoms.loadState.set("error");
};

/**
 * Reads the whole projection off the element in one pass. Used by `attach`,
 * which runs in an effect and can miss a `loadedmetadata` or `error` that
 * already fired, and by the `emptied` / `loadstart` reset.
 *
 * `lastAudibleVolume` is seeded rather than projected: without it, a
 * `volumechange` missed before `attach` leaves the memory at 1, and a click to
 * zero would restore full volume instead of what was playing.
 */
export function prime(
  element: SyncableMediaElement,
  atoms: ProjectionAtoms,
  pinned = false,
): void {
  atoms.volume.set(element.volume);
  atoms.muted.set(element.muted);
  if (!pinned && !element.muted && element.volume > 0) {
    atoms.lastAudibleVolume.set(element.volume);
  }
  atoms.rate.set(element.playbackRate);
  atoms.paused.set(element.paused);
  atoms.currentTime.set(element.currentTime);
  atoms.currentSecond.set(Math.floor(element.currentTime));
  projectDuration(element, atoms, pinned);
  atoms.readyState.set(element.readyState);
  const unusable = isUnusable(element);
  // Cleared when the element is usable, so a `src` swap away from a broken
  // track leaves no stale code behind for `useAudioError` to report.
  atoms.mediaErrorCode.set(unusable ? (element.error?.code ?? null) : null);
  atoms.loadState.set(loadStateOf(element));
}

/**
 * `"ready"` at `readyState: 0` too while the element is idle. Under
 * `preload="none"` nothing arrives until `play()`, so `"loading"` named a wait
 * that was not happening, and the play button said "Loading audio" (S34). The
 * wait after the press is real, and `isBuffering` covers it.
 */
function loadStateOf(element: SyncableMediaElement): LoadState {
  if (isUnusable(element)) return "error";
  return element.readyState >= 1 || element.networkState === NETWORK_IDLE
    ? "ready"
    : "loading";
}

/**
 * One handler per media event. Every handler writes what it reads off the
 * element and nothing else: none computes, and none reads an atom.
 */
export const HANDLERS = {
  timeupdate: projectTime,
  // The fast echo after a write to `el.currentTime`. `timeupdate` alone would
  // leave the atom stale for up to ~250 ms, with no event for the slider's
  // retain-until-changed rule to clear on.
  seeked: projectTime,
  loadedmetadata: (element, atoms, pinned) => {
    projectDuration(element, atoms, pinned);
    atoms.readyState.set(element.readyState);
    atoms.loadState.set("ready");
  },
  // The stall signal: `waiting` and `stalled` mark the rung dropping below
  // playable, the rest mark it recovering. A stall on a dead fetch is final.
  waiting: (element, atoms, pinned) => {
    projectReadyState(element, atoms, pinned);
    projectError(element, atoms, pinned);
  },
  stalled: (element, atoms, pinned) => {
    projectReadyState(element, atoms, pinned);
    projectError(element, atoms, pinned);
  },
  playing: projectReadyState,
  canplay: projectReadyState,
  canplaythrough: projectReadyState,
  progress: projectReadyState,
  durationchange: projectDuration,
  volumechange: (element, atoms, pinned) => {
    atoms.volume.set(element.volume);
    atoms.muted.set(element.muted);
    // Exact zero, not the approximate rule `useVolumeState` applies: a tiny but
    // audible volume is still worth remembering. Skipped while a drag holds the
    // pin, which emits a `volumechange` per sample and would erode the memory.
    if (!pinned && !element.muted && element.volume > 0) {
      atoms.lastAudibleVolume.set(element.volume);
    }
  },
  ratechange: (element, atoms) => {
    atoms.rate.set(element.playbackRate);
  },
  play: projectPaused,
  pause: (element, atoms, pinned) => {
    projectPaused(element, atoms, pinned);
    projectError(element, atoms, pinned);
  },
  // Both, not just `paused`: the element parks past `duration` and the final
  // `timeupdate` is not ordered against this event, so `useIsAtEnd` would race
  // it. Chrome reports `currentTime` slightly *greater* than `duration` here.
  ended: (element, atoms, pinned) => {
    projectPaused(element, atoms, pinned);
    projectTime(element, atoms, pinned);
    projectError(element, atoms, pinned);
  },
  // Corroborated against the element rather than trusted: see `isUnusable`.
  // An error the element plays through is left to it, so nothing latches.
  error: projectError,
  // The reset rows. `prime` re-reads `playbackRate` because the media load
  // algorithm resets it to `defaultPlaybackRate` without reliably firing
  // `ratechange`. These events are queued tasks, while the same algorithm
  // clears `error` and `readyState` synchronously beforehand, so the
  // unconditional `loadState` read cannot revive a stale error.
  emptied: prime,
  loadstart: prime,
  // Where `preload="none"` goes idle, after `loadstart` has primed to
  // `"loading"`.
  suspend: (element, atoms, pinned) => {
    atoms.loadState.set(loadStateOf(element));
    projectError(element, atoms, pinned);
  },
  // Keyed on `HTMLMediaElementEventMap`, so a misspelled event name is a build
  // error rather than a listener that silently never fires.
} satisfies Partial<Record<keyof HTMLMediaElementEventMap, SyncHandler>>;

export type SyncEvent = keyof typeof HANDLERS;

/**
 * Primes every atom off the element, then attaches the listeners. Priming first
 * makes an event missed before the effect ran — or during a `StrictMode`
 * attach → detach → attach — harmless.
 */
export function syncFromElement(
  element: SyncableMediaElement,
  atoms: ProjectionAtoms,
  { isAudibleVolumePinned }: SyncOptions = {},
): () => void {
  const pinned = () => isAudibleVolumePinned?.() ?? false;
  prime(element, atoms, pinned());

  const events = Object.keys(HANDLERS) as SyncEvent[];
  const detachers = events.map((event) => {
    const handler = HANDLERS[event];
    const listener = () => handler(element, atoms, pinned());
    element.addEventListener(event, listener);
    return () => element.removeEventListener(event, listener);
  });

  return () => detachers.forEach((detach) => detach());
}
