import { useStore } from "./atom";
import { usePlayerStore } from "./PlayerStoreContext";
import type { AudioPlayerControls } from "./createControls";
import { derivePlayerState, type AudioPlayerState } from "./playerState";
import { useAudioError } from "./derived";

export type { AudioPlayerControls } from "./createControls";
export type { AudioPlayerState } from "./playerState";

/**
 * The player's state and controls in one object, for UI the components do not
 * cover. Must be called inside `<AudioPlayer>`. The playback position is left
 * out because it changes about four times a second; read it with
 * `useCurrentSecond()` or `useCurrentTime()`.
 */
export function useAudioPlayer(): AudioPlayerState & AudioPlayerControls {
  const store = usePlayerStore();
  return {
    ...derivePlayerState({
      duration: useStore(store.duration),
      isLive: useStore(store.isLive),
      paused: useStore(store.paused),
      volume: useStore(store.volume),
      muted: useStore(store.muted),
      rate: useStore(store.rate),
      loadState: useStore(store.loadState),
      readyState: useStore(store.readyState),
      error: useAudioError(),
    }),
    ...store.controls,
  };
}

/**
 * The control methods alone, with no state: a component that only plays or
 * seeks does not re-render as the player changes.
 */
export function useAudioControls(): AudioPlayerControls {
  return usePlayerStore().controls;
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
