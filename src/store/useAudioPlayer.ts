import { useMemo } from "react";
import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "./atom";
import { usePlayerStore } from "./PlayerStoreContext";
import { HAVE_FUTURE_DATA } from "./syncFromElement";
import { useAudioError } from "./derived";
import type { AudioError, PlayerState, VolumeState } from "./derived";

/**
 * The control methods of `useAudioPlayer()`. Each keeps its identity for the
 * lifetime of the player, so it is safe in a dependency array.
 */
export type AudioPlayerControls = {
  /** Starts playback. */
  play: () => void;
  /** Pauses playback. */
  pause: () => void;
  /** Plays when paused, pauses when playing. */
  toggle: () => void;
  /** Seeks to a position in seconds. The browser clamps it to the track. */
  seek: (seconds: number) => void;
  /** Seeks relative to the position, in seconds. Negative rewinds. */
  seekBy: (seconds: number) => void;
  /** Sets the volume, `0`–`1`. Zero mutes; a value above zero unmutes. */
  setVolume: (volume: number) => void;
  /** Mutes, or unmutes to the last audible volume. */
  toggleMute: () => void;
  /** Sets the playback rate, clamped to `0.125`–`8`. */
  setRate: (rate: number) => void;
};

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

/**
 * The player's state and controls in one object, for UI the components do not
 * cover. Must be called inside `<AudioPlayer>`. The playback position is left
 * out because it changes about four times a second; read it with
 * `useCurrentSecond()` or `useCurrentTime()`.
 */
export function useAudioPlayer(): AudioPlayerState & AudioPlayerControls {
  const store = usePlayerStore();

  const duration = useStore(store.duration);
  const isLive = useStore(store.isLive);
  const paused = useStore(store.paused);
  const volume = useStore(store.volume);
  const muted = useStore(store.muted);
  const rate = useStore(store.rate);
  const loadState = useStore(store.loadState);
  const readyState = useStore(store.readyState);
  // Called rather than inlined: unlike the other derivations, this one reads
  // two atoms nothing else here subscribes to, so there is no duplication.
  const error = useAudioError();

  const controls = useMemo<AudioPlayerControls>(
    () => ({
      play: () => store.send({ type: "PLAY" }),
      pause: () => store.send({ type: "PAUSE" }),
      toggle: () => store.send({ type: "TOGGLE_PLAY" }),
      seek: (seconds) =>
        store.send({
          type: "CHANGE_VALUE",
          component: "timeline",
          value: seconds,
        }),
      seekBy: (seconds) =>
        store.send(
          seconds >= 0
            ? { type: "SET_TIME_FORWARD", value: seconds }
            : { type: "SET_TIME_BACKWARD", value: Math.abs(seconds) },
        ),
      setVolume: (value) =>
        store.send({ type: "CHANGE_VALUE", component: "volume", value }),
      toggleMute: () => store.send({ type: "TOGGLE_MUTE" }),
      setRate: (playbackRate) =>
        store.send({ type: "SET_PLAYBACK_RATE", playbackRate }),
    }),
    [store],
  );

  return {
    duration,
    paused,
    volume,
    muted,
    rate,
    playerState:
      loadState !== "ready" ? loadState : paused ? "paused" : "playing",
    volumeState:
      muted || areNumbersClose(volume, 0)
        ? "muted"
        : volume < 0.5
          ? "low"
          : "high",
    // Inlined like the two above, so it moves in lockstep with
    // `useIsDisabled` / `useIsSeekable`.
    isDisabled: loadState === "error",
    isSeekable: duration > 0,
    isLive,
    isBuffering:
      loadState === "ready" && !paused && readyState < HAVE_FUTURE_DATA,
    error,
    ...controls,
  };
}

/**
 * The playback position in whole seconds, re-rendering about once a second.
 * For a clock. For the raw position, use `useCurrentTime()`.
 */
export function useCurrentSecond(): number {
  const store = usePlayerStore();
  return useStore(store.currentSecond);
}

/**
 * The playback position in seconds as the element reports it, about four times
 * a second. For a waveform or a custom progress bar; a clock should use
 * `useCurrentSecond()`.
 */
export function useCurrentTime(): number {
  const store = usePlayerStore();
  return useStore(store.currentTime);
}
