import type { Atom } from "./atom";

export type LoadState = "loading" | "ready" | "error";

/**
 * `HTMLMediaElement.HAVE_FUTURE_DATA` — the rung at which the element has
 * enough data to actually advance. Below it, playback either has not started or
 * has stalled.
 */
export const HAVE_FUTURE_DATA = 3;

/**
 * The write side of the projection atoms. Only `createPlayerStore` holds this
 * bundle, and only through `attach` does it reach `syncFromElement`.
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
   * The raw `readyState` rung, projected so buffering can be *derived* rather
   * than tracked as policy. It overlaps `loadState` — which is roughly
   * `readyState >= 1` plus the error case — but both are direct projections
   * read from the same element at the same events, so they cannot diverge.
   */
  readyState: Atom<number>;
  loadState: Atom<LoadState>;
};

/**
 * Everything the sync layer touches on the element. Deliberately narrow: it is
 * what puts the suite one stub away from testable, with no jsdom audio.
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
 * `pinned` — whether a volume drag is holding `lastAudibleVolume` still — is the
 * one condition any row has. A parameter rather than an atom read, so "no row
 * reads an atom" survives and the exception is visible at every call site.
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
 * `duration` is `NaN` before metadata and `Infinity` for a live stream.
 * Normalising on write means no consumer has to know.
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
 * The rows that carry the stall signal. Every one of them reads the same
 * property — the events differ only in *when* the rung can have changed, and
 * `Object.is` drops the writes that did not move it, so `progress` firing
 * every few hundred milliseconds during a download wakes nobody.
 */
const projectReadyState: SyncHandler = (element, atoms) => {
  atoms.readyState.set(element.readyState);
};

/**
 * Reads the whole projection off the element in one pass. Called by `attach`,
 * which runs in an effect and so can miss a `loadedmetadata` or `error` that
 * already fired, and by the `emptied` / `loadstart` reset, where re-reading
 * everything cannot be wrong about what a `src` swap silently changed.
 *
 * `lastAudibleVolume` is seeded rather than projected: an element audible right
 * now *is* the last audible volume, and if it is silent the existing memory is
 * the better answer. Without the seed a `volumechange` lost before `attach`
 * leaves the memory at its initial 1, and a click straight to zero would then
 * restore full volume instead of what was playing.
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
  atoms.loadState.set(
    element.error ? "error" : element.readyState >= 1 ? "ready" : "loading",
  );
}

/**
 * One handler per media event. Every row writes what it reads off the element and
 * nothing else: no row computes, and no row reads an atom.
 */
export const HANDLERS = {
  timeupdate: projectTime,
  // The fast echo after any write to `el.currentTime`. Without it an atom carries
  // a stale time for up to ~250 ms, and the slider's retain-until-changed rule
  // has no event to clear on.
  seeked: projectTime,
  loadedmetadata: (element, atoms) => {
    atoms.duration.set(finite(element.duration));
    atoms.readyState.set(element.readyState);
    atoms.loadState.set("ready");
  },
  // Stall signal. `waiting` and `stalled` mark the rung dropping below
  // playable; the rest mark it recovering.
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
    // Exact, not the approximate `areNumbersClose` rule the mute *derivation*
    // uses: an audible-but-tiny volume is still worth remembering.
    //
    // Unless a drag holds the pin. A drag emits a `volumechange` per sample, so
    // without this the memory erodes to the last non-zero value it passed
    // through, and unmuting afterwards restores a whisper. The values a drag
    // passes *through* are not settings anyone chose.
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
  error: (_element, atoms) => {
    atoms.loadState.set("error");
  },
  // The reset rows. `prime` re-reads `playbackRate` because the media load
  // algorithm resets it to `defaultPlaybackRate` without reliably firing
  // `ratechange`. Its unconditional `loadState` read cannot resurrect a stale
  // error: `emptied` is a queued task, while `error = null` and
  // `readyState = HAVE_NOTHING` are set synchronously earlier in the same
  // algorithm, so the handler always runs after the reset.
  emptied: prime,
  loadstart: prime,
  // `Partial<Record<keyof HTMLMediaElementEventMap, ...>>`, not
  // `Record<string, ...>`: a misspelled event name is then a build error rather
  // than a row that silently never fires.
} satisfies Partial<Record<keyof HTMLMediaElementEventMap, SyncHandler>>;

export type SyncEvent = keyof typeof HANDLERS;

/**
 * Primes every atom off the element, then attaches every listener. Priming first
 * is what makes an event landing before the effect ran — or in a `StrictMode`
 * attach → detach → attach gap — harmless.
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
