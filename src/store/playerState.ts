import { areNumbersClose } from "../Shared/areNumbersClose";
import { HAVE_FUTURE_DATA, type LoadState } from "./syncFromElement";
import type { AudioError, PlayerState, VolumeState } from "./derived";

/**
 * The state half of `useAudioPlayer()`. The playback position is not part of
 * it; see `useCurrentSecond()`.
 */
export type AudioPlayerState = {
  /** The track length in seconds; `0` before metadata and on a live stream. */
  duration: number;
  /** Whether playback is paused. */
  paused: boolean;
  /** The volume, `0`–`1`. */
  volume: number;
  /** Whether the element is muted. */
  muted: boolean;
  /** The playback rate; `1` is normal speed. */
  rate: number;
  /** Error, loading, paused or playing. */
  playerState: PlayerState;
  /** Which icon a mute button should show. */
  volumeState: VolumeState;
  /** Whether the track has failed to load. Loading does not disable. */
  isDisabled: boolean;
  /** Whether a position can be named: the duration is known. See `useIsSeekable()`. */
  isSeekable: boolean;
  /** Whether the track is a live stream. See `useIsLive()`. */
  isLive: boolean;
  /** Whether playback is waiting for data. See `useIsBuffering()`. */
  isBuffering: boolean;
  /** The last failure, or `null`. See `useAudioError()`. */
  error: AudioError | null;
};

// Inlined rather than built from the derived hooks, so the state moves in
// lockstep with `usePlayerState`, `useIsDisabled` and `useIsSeekable` without
// subscribing twice.
export function derivePlayerState(atoms: {
  duration: number;
  isLive: boolean;
  paused: boolean;
  volume: number;
  muted: boolean;
  rate: number;
  loadState: LoadState;
  readyState: number;
  error: AudioError | null;
}): AudioPlayerState {
  const { duration, paused, volume, muted, loadState, readyState } = atoms;
  return {
    duration,
    paused,
    volume,
    muted,
    rate: atoms.rate,
    playerState:
      loadState !== "ready" ? loadState : paused ? "paused" : "playing",
    volumeState:
      muted || areNumbersClose(volume, 0)
        ? "muted"
        : volume < 0.5
          ? "low"
          : "high",
    isDisabled: loadState === "error",
    isSeekable: duration > 0,
    isLive: atoms.isLive,
    isBuffering:
      loadState === "ready" && !paused && readyState < HAVE_FUTURE_DATA,
    error: atoms.error,
  };
}
