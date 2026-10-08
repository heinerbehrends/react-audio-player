import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "./atom";
import { HAVE_FUTURE_DATA } from "./syncFromElement";
import { usePlayerStore } from "./PlayerStoreContext";

/**
 * The player's overall state, in order of precedence: `"error"`, then
 * `"loading"` while metadata is on its way, then `"paused"` or `"playing"`.
 * The controls still work while loading. A stall mid-track stays `"playing"`;
 * `useIsBuffering()` reports it.
 */
export type PlayerState = "loading" | "error" | "paused" | "playing";

/**
 * Why the resource is unusable, from the element's `MediaError.code`:
 * `"aborted"` the fetch was stopped, `"network"` it failed after starting,
 * `"decode"` the data could not be decoded, `"unsupported"` the format or `src`
 * was rejected, which a 404 also reports, and `"unknown"` any other code.
 */
export type MediaErrorReason =
  "aborted" | "network" | "decode" | "unsupported" | "unknown";

/**
 * A playback failure. `kind: "media"` means the resource is unusable and only a
 * retry or another `src` will help. `kind: "playback"` means the browser
 * refused `play()`, usually autoplay policy, and `reason` is the
 * `DOMException` name; the controls stay enabled, since a user gesture lifts it.
 */
export type AudioError =
  | { kind: "media"; reason: MediaErrorReason }
  | { kind: "playback"; reason: string };

/**
 * Which icon a mute button should show. `"muted"` covers a muted element and a
 * volume within 0.001 of zero; `"low"` is below 0.5 and `"high"` is 0.5 or more.
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
 * Whether a position on the track can be named: the duration is known and
 * non-zero. False before `loadedmetadata` and on a live stream. This is the
 * test that disables the timeline and `SeekButton`.
 */
export function useIsSeekable(): boolean {
  const store = usePlayerStore();
  const duration = useStore(store.duration);

  return duration > 0;
}

/**
 * Whether the track is a live stream: the element reports an unbounded
 * duration, or `track.live` is set. False before metadata, so it is not the
 * inverse of `useIsSeekable()`: that one says a position cannot be named yet,
 * this one says it never will be.
 */
export function useIsLive(): boolean {
  const store = usePlayerStore();
  return useStore(store.isLive);
}

const MEDIA_ERROR_REASONS: Record<number, MediaErrorReason> = {
  1: "aborted",
  2: "network",
  3: "decode",
  4: "unsupported",
};

/** The last failure, or `null`. A media error wins when both kinds are set. */
export function useAudioError(): AudioError | null {
  const store = usePlayerStore();
  return audioErrorOf(
    useStore(store.mediaErrorCode),
    useStore(store.playbackError),
  );
}

export function audioErrorOf(
  code: number | null,
  playbackError: string | null,
): AudioError | null {
  if (code !== null) {
    return { kind: "media", reason: MEDIA_ERROR_REASONS[code] ?? "unknown" };
  }
  if (playbackError !== null) {
    return { kind: "playback", reason: playbackError };
  }
  return null;
}

/**
 * Whether playback wants to advance and has no data to: the spinner condition.
 * Independent of `PlayerState`, which stays `"playing"` through a stall. A seek
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
 * Whether the position is at the end of the track. A statement about position,
 * not history: dragging to the end reports `true`, and it clears as soon as the
 * position moves. For the moment a track finishes, use `onEnded`. Stays `false`
 * with `loop`, where the element wraps to `0` instead.
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
 * The numbers behind `Time.Elapsed` and `Time.Remaining`, in whole seconds,
 * updating once a second. For a readout of your own that `labels.time` cannot
 * express; format them with `formatTime`.
 */
export function useTimeDisplay(): {
  /** The position. */
  elapsed: number;
  /** The time left, as a magnitude clamped at `0`. Write the `-` yourself. */
  remaining: number;
} {
  const store = usePlayerStore();
  const currentSecond = useStore(store.currentSecond);
  const duration = useStore(store.duration);

  return {
    elapsed: currentSecond,
    remaining: Math.max(duration - currentSecond, 0),
  };
}
