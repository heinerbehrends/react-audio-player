import { useMemo } from "react";
import { areNumbersClose } from "../Shared/sharedFunctions";
import { useStore } from "./atom";
import { usePlayerStore } from "./PlayerStoreContext";
import { HAVE_FUTURE_DATA } from "./syncFromElement";
import type { PlayerState, VolumeState } from "./derived";

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
  isDisabled: boolean;
  /**
   * Playback wants to advance and cannot — the spinner condition. Independent
   * of `playerState`, which stays `"playing"` through a stall because the
   * player is still in play mode.
   */
  isBuffering: boolean;
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
    isDisabled: loadState !== "ready",
    isBuffering:
      loadState === "ready" && !paused && readyState < HAVE_FUTURE_DATA,
    ...controls,
  };
}

export function useCurrentSecond(): number {
  const store = usePlayerStore();
  return useStore(store.currentSecond);
}

export function useCurrentTime(): number {
  const store = usePlayerStore();
  return useStore(store.currentTime);
}
