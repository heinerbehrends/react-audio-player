import { useMemo } from "react";
import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "./atom";
import { usePlayerStore } from "./PlayerStoreContext";
import { HAVE_FUTURE_DATA } from "./syncFromElement";
import { useAudioError } from "./derived";
import type { AudioError, PlayerState, VolumeState } from "./derived";

export type AudioPlayerControls = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Absolute, in seconds. The browser clamps to the track. */
  seek: (seconds: number) => void;
  /** Relative, in seconds. Negative rewinds. */
  seekBy: (seconds: number) => void;
  /** 0–1. Setting it to zero mutes, exactly as it does on the slider. */
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRate: (rate: number) => void;
};

export type AudioPlayerState = {
  duration: number;
  paused: boolean;
  volume: number;
  muted: boolean;
  rate: number;
  playerState: PlayerState;
  volumeState: VolumeState;
  /**
   * The track is errored. Loading does not disable: the element accepts `play()`,
   * `volume`, `muted` and `playbackRate` before metadata. See `useIsDisabled()`.
   */
  isDisabled: boolean;
  /**
   * A position on the track can be named — the duration is known and non-zero.
   * False before `loadedmetadata` and on a live stream, which is what gates the
   * timeline and the seek buttons rather than the load state. See
   * `useIsSeekable()`.
   */
  isSeekable: boolean;
  /**
   * Playback wants to advance and cannot — the spinner condition. Independent
   * of `playerState`, which stays `"playing"` through a stall because the
   * player is still in play mode.
   */
  isBuffering: boolean;
  /**
   * The last failure, or `null`. `kind: "media"` means the resource is
   * unusable; `kind: "playback"` means the browser refused the command.
   */
  error: AudioError | null;
};

export function useAudioPlayer(): AudioPlayerState & AudioPlayerControls {
  const store = usePlayerStore();

  const duration = useStore(store.duration);
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
    // Inlined like the two above it, and so has to move in lockstep with
    // `useIsDisabled` / `useIsSeekable`, which carry the reasoning.
    isDisabled: loadState === "error",
    isSeekable: duration > 0,
    isBuffering:
      loadState === "ready" && !paused && readyState < HAVE_FUTURE_DATA,
    error,
    ...controls,
  };
}

/**
 * The playback position in whole seconds, for anything that renders a clock.
 *
 * Separate from `useAudioPlayer()` on purpose: the position changes about four
 * times a second, so folding it in would re-render every caller at that rate.
 * This quantises to the second, so a component reading it re-renders about once
 * a second rather than four times. Use `useCurrentTime()` if you need the raw
 * value.
 */
export function useCurrentSecond(): number {
  const store = usePlayerStore();
  return useStore(store.currentSecond);
}

/**
 * The raw playback position in seconds, fractional, updating at the element's own
 * rate — roughly 4 Hz, and not on a timer of its own.
 *
 * For anything that draws rather than reads: a waveform playhead, a custom
 * progress bar. For a clock use `useCurrentSecond()`, which re-renders a quarter
 * as often.
 */
export function useCurrentTime(): number {
  const store = usePlayerStore();
  return useStore(store.currentTime);
}
