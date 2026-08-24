import { areNumbersClose } from "../Shared/sharedFunctions";
import { useStore } from "./atom";
import { usePlayerStore } from "./PlayerStoreContext";

export type PlayerState = "loading" | "error" | "paused" | "playing";
export type VolumeState = "muted" | "low" | "high";

/**
 * Every derivation the components consume, in one file, so the rule is auditable
 * in one place instead of spread across the six components that read it. Each
 * returns a primitive computed in render: there is no cache to invalidate, and
 * `useSyncExternalStore`'s "getSnapshot should be cached" invariant cannot bite.
 */

/**
 * Replaces `playerReducer`'s `playerState`. An extension of `loadState` rather
 * than a reconstruction of it: the two non-`"ready"` states pass straight
 * through, and TypeScript narrows them.
 */
export function usePlayerState(): PlayerState {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);
  const paused = useStore(store.paused);

  return loadState !== "ready" ? loadState : paused ? "paused" : "playing";
}

/**
 * Replaces `SET_VOLUME_STATE` and `isMuted`, which was a second mirror of
 * `muted`. The near-zero rule stays approximate — the volume slider can land a
 * hair off zero and the UI treats that as muted — even though
 * `lastAudibleVolume`'s memory of what to restore is exact.
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
 * One subscription and one comparison: `loadState` already *is* what the old
 * `playerState === "loading" || playerState === "error"` was reconstructing.
 */
export function useIsDisabled(): boolean {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);

  return loadState !== "ready";
}

/**
 * The elapsed and remaining clock. Both come off `currentSecond`, the 1 Hz atom,
 * so the 1-second `setInterval` that used to race a 4 Hz event source is gone —
 * `currentSecond` *is* the 1 Hz clock and cannot drift from it.
 *
 * `remaining` is derived in render rather than stored, which is why the
 * precedence bug that made it a constant cannot come back.
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
