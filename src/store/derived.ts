import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "./atom";
import { HAVE_FUTURE_DATA } from "./syncFromElement";
import { usePlayerStore } from "./PlayerStoreContext";

/**
 * The player's state, decided in this order: error, then loading, then
 * play/pause.
 *
 * `"loading"` means metadata has not arrived; the controls still work there, and
 * a track change re-enters it. A mid-track stall stays `"playing"` —
 * `useIsBuffering()` reports that.
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
 * `DOMException` name. Controls stay enabled for that one, since a user gesture
 * is what lifts it.
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

// Each derivation returns a primitive computed during render, so there is no
// snapshot to cache and none to invalidate.

/** Widens `loadState`: `"ready"` splits into paused and playing, the rest pass through. */
export function usePlayerState(): PlayerState {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);
  const paused = useStore(store.paused);

  return loadState !== "ready" ? loadState : paused ? "paused" : "playing";
}

/** Treats a near-zero volume as muted, since a slider rarely lands exactly on 0. */
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
 * True only on an error. Loading disables nothing — a `src` change re-enters it,
 * so gating here would swallow the first press on every playlist advance; the
 * accessible name says "Loading audio" instead (A4).
 *
 * Reads `loadState`, so an autoplay refusal does not disable. Seeking is gated
 * on the duration instead — `useIsSeekable`.
 */
export function useIsDisabled(): boolean {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);

  return loadState === "error";
}

/**
 * Whether a position on the track can be named — the duration is known and
 * non-zero. Gates the timeline slider, which would otherwise announce
 * `min=0 max=0 now=0` and take arrow keys into it (A5), and `SeekButton`.
 *
 * False before `loadedmetadata` and on a live stream, whose `readyState` is
 * healthy — so no load-state check reaches it.
 */
export function useIsSeekable(): boolean {
  const store = usePlayerStore();
  const duration = useStore(store.duration);

  return duration > 0;
}

const MEDIA_ERROR_REASONS: Record<number, MediaErrorReason> = {
  1: "aborted",
  2: "network",
  3: "decode",
  4: "unsupported",
};

/**
 * The last failure, or `null`. A media error wins when both are set, being the
 * more fundamental of the two.
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
 * True while playback wants to advance and cannot — the spinner condition.
 * Derived from `readyState` rather than tracked, so there is no flag to get
 * stuck on.
 *
 * Independent of `usePlayerState`, which stays `"playing"` through a stall: the
 * player is still in play mode, so the button must still offer Pause. A seek
 * while paused does not count.
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
 * A statement about position, not about history: dragging to the end reports
 * `true` with nothing having played, and it clears as soon as the position
 * moves. Use `onEnded` for the edge, this for the level.
 *
 * Stays `false` under `audioProps={{ loop: true }}`, where the element wraps to
 * 0 rather than resting at the end.
 */
export function useIsAtEnd(): boolean {
  const store = usePlayerStore();
  const currentTime = useStore(store.currentTime);
  const duration = useStore(store.duration);

  // `>=`, not an approximate match: Chrome parks `currentTime` about 0.5 s past
  // `duration`, so a tolerance test reads false at the moment the track ends.
  return duration > 0 && currentTime >= duration;
}

/**
 * Both values come off `currentSecond`, the store's 1 Hz clock, so no interval
 * races the ~4 Hz event source.
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
