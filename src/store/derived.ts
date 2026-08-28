import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "./atom";
import { HAVE_FUTURE_DATA } from "./syncFromElement";
import { usePlayerStore } from "./PlayerStoreContext";

export type PlayerState = "loading" | "error" | "paused" | "playing";
export type MediaErrorReason =
  | "aborted"
  | "network"
  | "decode"
  | "unsupported"
  | "unknown";
export type AudioError =
  | { kind: "media"; reason: MediaErrorReason }
  | { kind: "playback"; reason: string };
export type VolumeState = "muted" | "low" | "high";

/**
 * Every derivation the components consume. Each returns a primitive computed
 * during render, so there is no snapshot to cache and none to invalidate.
 */

/** Widens `loadState`: `"ready"` splits into paused and playing, the rest pass through. */
export function usePlayerState(): PlayerState {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);
  const paused = useStore(store.paused);

  return loadState !== "ready" ? loadState : paused ? "paused" : "playing";
}

/**
 * Treats a near-zero volume as muted, since a slider rarely lands exactly on 0.
 * The `lastAudibleVolume` memory it restores from is exact.
 */
export function useVolumeState(): VolumeState {
  const store = usePlayerStore();
  const volume = useStore(store.volume);
  const muted = useStore(store.muted);

  if (muted || areNumbersClose(volume, 0)) {
    return "muted";
  }
  return volume < 0.5 ? "low" : "high";
}

/**
 * Only an error makes a control unavailable. Loading does not: `play()` at
 * `readyState: 0` is legal and the browser queues it, and `volume`, `muted` and
 * `playbackRate` are all settable before metadata — so suppressing them silently
 * drops the first interaction most users attempt. Worse, changing
 * `audioFile.src` re-enters loading, so a gate on the load state would recur on
 * every playlist advance rather than only at startup.
 *
 * The load state is still announced, through the accessible name ("Loading
 * audio") rather than through suppression — see A4.
 *
 * Not every failure disables, either: this reads `loadState`, so it sees a
 * `MediaError` but not a `playbackError`. An autoplay refusal leaves every
 * control enabled, which is the only workable answer — a user gesture is what
 * lifts it, and a disabled Play button makes that gesture impossible.
 *
 * What loading *does* gate is seeking, which needs a duration. That is
 * [[useIsSeekable]], keyed on the range itself rather than on the load state.
 */
export function useIsDisabled(): boolean {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);

  return loadState === "error";
}

/**
 * Whether a position on the track can be named at all. Everything that has to
 * map a value onto the duration reads this: the timeline slider, whose aria
 * range would otherwise announce `min=0 max=0 now=0` and accept arrow keys into
 * it (A5), and `SeekButton`, which sends `SET_TIME_FORWARD` in both directions
 * and so reads `duration` whichever way it points.
 *
 * `duration > 0` is the whole predicate, and a non-finite check would be dead
 * code: `finite()` in `syncFromElement.ts` maps `NaN` and `Infinity` to 0 at
 * every write site, so the atom cannot hold either. That is what folds two cases
 * into one — a player before `loadedmetadata`, and a live stream whose duration
 * is `Infinity` while its `readyState` is perfectly healthy. No load-state check
 * reaches the second.
 *
 * Derived rather than tracked, like [[useIsBuffering]]: there is no flag to get
 * stuck on.
 */
export function useIsSeekable(): boolean {
  const store = usePlayerStore();
  const duration = useStore(store.duration);

  return duration > 0;
}

/** `MediaError.code` is a numeric enum; these are its four members. */
const MEDIA_ERROR_REASONS: Record<number, MediaErrorReason> = {
  1: "aborted",
  2: "network",
  3: "decode",
  4: "unsupported",
};

/**
 * The two ways playback can fail, which differ in what a consumer should do
 * about them: a `"media"` error means the resource is unusable and only a
 * different `src` or a retry will help, while `"playback"` means the resource
 * is fine and the browser refused the command — almost always autoplay policy,
 * which a user gesture lifts.
 *
 * A media error wins when both are set, being the more fundamental of the two.
 */
export function useAudioError(): AudioError | null {
  const store = usePlayerStore();
  const code = useStore(store.mediaErrorCode);
  const playbackError = useStore(store.playbackError);

  if (code !== null) {
    return { kind: "media", reason: MEDIA_ERROR_REASONS[code] ?? "unknown" };
  }
  if (playbackError !== null) {
    return { kind: "playback", reason: playbackError };
  }
  return null;
}

/**
 * True while playback wants to advance and cannot: loaded, not paused, and
 * below the rung where the element has data to play. Derived from `readyState`
 * rather than tracked, so there is no flag to get stuck on.
 *
 * Independent of `usePlayerState`, which stays `"playing"` through a stall: the
 * player is still in play mode, so the button must still offer Pause.
 *
 * A seek while paused is not reported as buffering — `paused` gates it.
 */
export function useIsBuffering(): boolean {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);
  const paused = useStore(store.paused);
  const readyState = useStore(store.readyState);

  return loadState === "ready" && !paused && readyState < HAVE_FUTURE_DATA;
}

/**
 * Both values come off `currentSecond`, the store's 1 Hz clock, so no interval
 * races the ~4 Hz event source. `remaining` is derived during render, so it
 * cannot go stale.
 */
export function useTimeDisplay(): { elapsed: number; remaining: number } {
  const store = usePlayerStore();
  const currentSecond = useStore(store.currentSecond);
  const duration = useStore(store.duration);

  return {
    elapsed: currentSecond,
    remaining: Math.max(duration - currentSecond, 0),
  };
}
