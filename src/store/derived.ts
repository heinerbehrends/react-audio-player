import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "./atom";
import { HAVE_FUTURE_DATA } from "./syncFromElement";
import { usePlayerStore } from "./PlayerStoreContext";

/**
 * The four player states, in the order they are decided: an error wins over
 * everything, then loading, then play/pause.
 *
 * `"loading"` means metadata has not arrived. It does **not** mean the controls
 * are unavailable — `play()`, volume and rate all work there — and it is
 * re-entered on every track change, not only at startup. A mid-track stall stays
 * `"playing"`; `useIsBuffering()` reports that.
 */
export type PlayerState = "loading" | "error" | "paused" | "playing";

/**
 * Why a resource is unusable, from the element's `MediaError.code`.
 *
 * `"aborted"` — the fetch was stopped. `"network"` — it failed after starting.
 * `"decode"` — the bytes arrived and could not be decoded. `"unsupported"` — the
 * format or `src` was rejected outright, which is also what an empty or 404'd
 * `src` reports. `"unknown"` — a code outside the spec's four.
 */
export type MediaErrorReason =
  "aborted" | "network" | "decode" | "unsupported" | "unknown";

/**
 * The two ways playback fails, separated because they need different handling.
 *
 * `kind: "media"` — the resource is unusable; only a different `src` or a retry
 * will help. `kind: "playback"` — the resource is fine and the browser refused
 * the command, almost always autoplay policy, and `reason` is the
 * `DOMException` name. Controls stay enabled for the second, since a user
 * gesture is what lifts it.
 */
export type AudioError =
  | { kind: "media"; reason: MediaErrorReason }
  | { kind: "playback"; reason: string };

/**
 * Which of three icons a mute button should show. Mutually exclusive and
 * exhaustive.
 *
 * `"muted"` covers a muted element and a volume within 0.001 of zero — a slider
 * dragged to the end rarely lands on exactly 0. The low/high boundary is 0.5,
 * and 0.5 counts as high.
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
 * True only on an error. Loading disables nothing: `play()`, `volume`, `muted`
 * and `playbackRate` all work before metadata, and a `src` change re-enters
 * loading — so gating here would swallow the first press on every playlist
 * advance. The accessible name says "Loading audio" instead (A4).
 *
 * Reads `loadState`, so it sees a `MediaError` but not a `playbackError`. An
 * autoplay refusal leaves controls enabled, since a user gesture is what lifts
 * it.
 *
 * Seeking is gated on the duration instead: [[useIsSeekable]].
 */
export function useIsDisabled(): boolean {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);

  return loadState === "error";
}

/**
 * Whether a position on the track can be named. Read by the two controls that
 * map a value onto the duration: the timeline slider, which would otherwise
 * announce `min=0 max=0 now=0` and take arrow keys into it (A5), and
 * `SeekButton`.
 *
 * `duration > 0` is the whole test. `finite()` in `syncFromElement` maps `NaN`
 * and `Infinity` to 0, so this covers a player before `loadedmetadata` and a
 * live stream alike — and a stream's `readyState` is healthy, so no load-state
 * check reaches it.
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
 * Whether the position is the end of the track — for an end-of-track card, a
 * Replay button, or greying out "next".
 *
 * Derived rather than tracked, like [[useIsBuffering]]: there is no flag to get
 * stuck on, and nothing to go stale across a `src` change.
 *
 * `>=`, not an approximate match: a browser parks slightly *past* `duration`
 * when playback ends — Chrome reports `currentTime` about 0.5 s beyond it — so a
 * tolerance-based test reads false at exactly the moment the track finishes.
 *
 * This is a statement about position, not about history. Dragging to the end
 * reports `true` without anything having played, and it clears as soon as the
 * position moves. Use `onEnded` for the edge — "advance now" — and this for the
 * level.
 *
 * A looping element wraps to 0 rather than resting at the end, and does so
 * without a `timeupdate` reporting the end — measured in Chrome, where
 * `currentTime` peaked at 283.15 against a duration of 283.33 — so this stays
 * false under `audioProps={{ loop: true }}`.
 */
export function useIsAtEnd(): boolean {
  const store = usePlayerStore();
  const currentTime = useStore(store.currentTime);
  const duration = useStore(store.duration);

  return duration > 0 && currentTime >= duration;
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
