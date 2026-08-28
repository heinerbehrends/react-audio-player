import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "./atom";
import { HAVE_FUTURE_DATA } from "./syncFromElement";
import { usePlayerStore } from "./PlayerStoreContext";

/**
 * The four states a player can be in, in the order they are decided: an error
 * wins over everything, then loading, then play/pause.
 *
 * `"loading"` means metadata has not arrived. It does **not** mean the controls
 * are unavailable — `play()`, the volume and the rate all work there — and it is
 * re-entered on every track change, not only at startup. A mid-track stall is
 * not this: it stays `"playing"`, and `useIsBuffering()` reports it.
 */
export type PlayerState = "loading" | "error" | "paused" | "playing";

/**
 * Why a resource is unusable, from the element's `MediaError.code`.
 *
 * `"aborted"` — the fetch was stopped. `"network"` — it failed after starting.
 * `"decode"` — the bytes arrived and could not be decoded. `"unsupported"` — the
 * format or the `src` was rejected outright, which is also what an empty or
 * 404'd `src` reports. `"unknown"` covers a code outside the spec's four.
 */
export type MediaErrorReason =
  | "aborted"
  | "network"
  | "decode"
  | "unsupported"
  | "unknown";

/**
 * The two ways playback fails, separated because they need different handling.
 *
 * `kind: "media"` — the resource is unusable, and only a different `src` or a
 * retry will help. `kind: "playback"` — the resource is fine and the browser
 * refused the command, almost always autoplay policy, which a user gesture
 * lifts; `reason` is the `DOMException` name. Controls stay enabled for the
 * second, deliberately: a disabled Play button would make that gesture
 * impossible.
 */
export type AudioError =
  | { kind: "media"; reason: MediaErrorReason }
  | { kind: "playback"; reason: string };

/**
 * Which of three icons a mute button should show. Mutually exclusive and
 * exhaustive.
 *
 * `"muted"` covers both a muted element and a volume within 0.001 of zero, since
 * a slider dragged to the end rarely lands on exactly 0. The low/high boundary is
 * 0.5, and 0.5 itself is high.
 */
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
