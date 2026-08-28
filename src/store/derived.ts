import { areNumbersClose } from "../Shared/sharedFunctions";
import { useStore } from "./atom";
import { HAVE_FUTURE_DATA } from "./syncFromElement";
import { usePlayerStore } from "./PlayerStoreContext";

export type PlayerState = "loading" | "error" | "paused" | "playing";
export type VolumeState = "muted" | "low" | "high";

/**
 * Every derivation the components consume, in one auditable place. Each returns
 * a primitive computed in render: no cache to invalidate, and
 * `useSyncExternalStore`'s "getSnapshot should be cached" invariant cannot bite.
 */

/**
 * An extension of `loadState`, not a reconstruction of it: the two non-`"ready"`
 * states pass straight through, and TypeScript narrows them.
 */
export function usePlayerState(): PlayerState {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);
  const paused = useStore(store.paused);

  return loadState !== "ready" ? loadState : paused ? "paused" : "playing";
}

/**
 * The near-zero rule is approximate — the slider can land a hair off zero and the
 * UI treats that as muted — even though `lastAudibleVolume`'s memory of what to
 * restore is exact.
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
 * Playback wants to advance and cannot: loaded, not paused, and below the rung
 * where the element has data to play. Derived rather than tracked, so there is
 * no `waiting`/`playing` flag to get stuck on — the rung is read off the
 * element and the interpretation happens here.
 *
 * Orthogonal to `usePlayerState`, deliberately. A stalled player is still in
 * play mode, so the button must still offer Pause; replacing `"playing"` with a
 * `"buffering"` state would lose that.
 *
 * A seek while paused into unbuffered audio is *not* reported as buffering,
 * because `paused` gates it. Reporting that too would need a `seeking`
 * projection as well.
 */
export function useIsBuffering(): boolean {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);
  const paused = useStore(store.paused);
  const readyState = useStore(store.readyState);

  return loadState === "ready" && !paused && readyState < HAVE_FUTURE_DATA;
}

/**
 * Both halves come off `currentSecond`, so there is no interval racing the 4 Hz
 * event source — `currentSecond` *is* the 1 Hz clock. `remaining` is derived in
 * render rather than stored, so it cannot go stale.
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
