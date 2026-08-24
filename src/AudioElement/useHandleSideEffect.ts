import { usePlayerStore } from "../store/PlayerStoreContext";

/**
 * A thin alias for `store.send` while the slider bus still calls it. The
 * `useCallback` and the `AudioContext` read are gone: `send` has a permanent
 * identity, and it is the only caller of `handleSideEffect` that can supply the
 * store state `TOGGLE_MUTE` / `UNMUTE` need.
 */
export function useHandleSideEffect() {
  return usePlayerStore().send;
}
