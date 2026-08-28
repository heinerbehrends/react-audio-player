import type { Atom } from "./atom";

export type LoadState = "loading" | "ready" | "error";

/**
 * `HTMLMediaElement.HAVE_FUTURE_DATA`: the element has enough data to advance
 * playback. Below it, playback has not started or has stalled.
 */
export const HAVE_FUTURE_DATA = 3;

/**
 * The write side of the projection atoms. Only `createPlayerStore` holds this
 * bundle, and it reaches `syncFromElement` only through `attach`.
 */
export type ProjectionAtoms = {
  currentTime: Atom<number>;
  currentSecond: Atom<number>;
  duration: Atom<number>;
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
  error: MediaError | null;
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

const projectDuration: SyncHandler = (element, atoms) => {
  atoms.duration.set(finite(element.duration));
};

/** Never toggled: always read off the element. */
const projectPaused: SyncHandler = (element, atoms) => {
  atoms.paused.set(element.paused);
};

/**
 * Shared by every event that can move the rung; they differ only in when that
 * happens. `Object.is` drops the writes that did not move it, so `progress`
 * firing every few hundred milliseconds during a download wakes nobody.
 */
const projectReadyState: SyncHandler = (element, atoms) => {
  atoms.readyState.set(element.readyState);
};

/**
 * Reads the whole projection off the element in one pass. Used by `attach`,
 * which runs in an effect and can miss a `loadedmetadata` or `error` that
 * already fired, and by the `emptied` / `loadstart` reset, where a `src` swap
 * may have changed anything.
 *
 * `lastAudibleVolume` is seeded rather than projected: an element that is
 * audible now *is* the last audible volume, and if it is silent the existing
 * memory is the better answer. Without the seed, a `volumechange` missed before
 * `attach` leaves the memory at 1, and a click to zero would restore full
 * volume instead of what was playing.
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
  atoms.duration.set(finite(element.duration));
  atoms.readyState.set(element.readyState);
  atoms.mediaErrorCode.set(element.error?.code ?? null);
  atoms.loadState.set(
    element.error ? "error" : element.readyState >= 1 ? "ready" : "loading",
  );
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
  loadedmetadata: (element, atoms) => {
    atoms.duration.set(finite(element.duration));
    atoms.readyState.set(element.readyState);
    atoms.loadState.set("ready");
  },
  // The stall signal: `waiting` and `stalled` mark the rung dropping below
  // playable, the rest mark it recovering.
  waiting: projectReadyState,
  stalled: projectReadyState,
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
    // pin, since a drag emits a `volumechange` per sample and the memory would
    // erode to the last value it happened to pass through.
    if (!pinned && !element.muted && element.volume > 0) {
      atoms.lastAudibleVolume.set(element.volume);
    }
  },
  ratechange: (element, atoms) => {
    atoms.rate.set(element.playbackRate);
  },
  play: projectPaused,
  pause: projectPaused,
  ended: projectPaused,
  error: (element, atoms) => {
    atoms.mediaErrorCode.set(element.error?.code ?? null);
    atoms.loadState.set("error");
  },
  // The reset rows. `prime` re-reads `playbackRate` because the media load
  // algorithm resets it to `defaultPlaybackRate` without reliably firing
  // `ratechange`. These events are queued tasks, while the same algorithm
  // clears `error` and `readyState` synchronously beforehand, so the
  // unconditional `loadState` read cannot revive a stale error.
  emptied: prime,
  loadstart: prime,
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
