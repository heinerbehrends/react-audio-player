import { areNumbersClose } from "../Shared/sharedFunctions";
import { useStore } from "./atom";
import { HAVE_FUTURE_DATA } from "./syncFromElement";
import { usePlayerStore } from "./PlayerStoreContext";

export type PlayerState = "loading" | "error" | "paused" | "playing";
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

export function useIsDisabled(): boolean {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);

  return loadState !== "ready";
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
