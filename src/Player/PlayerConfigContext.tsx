/* eslint-disable react-refresh/only-export-components --
   The provider and its hook are one unit, and the context object stays private
   so the null-default guard below cannot be bypassed. */
import { createContext, useContext } from "react";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";

export type AudioFile = {
  src: string;
};

/**
 * Static config: `AudioPlayer`'s two props, flowing strictly downward. Neither
 * is state and neither is a projection of the element, so no atom wants them —
 * but `audioFile` is read by `AudioElement` and `customKeyboardShortcuts` by
 * `useHandleMediaKeys`, which seven components call, and there is no
 * prop-drilling path to `SetSliderValue`. Hence a context, not the store.
 */
export type PlayerConfig = {
  audioFile: AudioFile;
  customKeyboardShortcuts: KeyToActionMap | undefined;
};

// No default value, for the reason `PlayerStoreContext` has none: a default is
// why `AudioContext`'s `if (!context)` guard can never fire.
const PlayerConfigContext = createContext<PlayerConfig | null>(null);
PlayerConfigContext.displayName = "PlayerConfigContext";

type PlayerConfigProviderProps = PlayerConfig & {
  children: React.ReactNode;
};

/**
 * Deliberately unmemoised. The documented usage passes `audioFile` as an
 * inline object literal, so a `memo` comparison and a `useMemo` dependency check
 * would both fail on every consumer render and buy nothing. When they bail the
 * cost is seven cheap components rendering, which is what React does by
 * default; a memo that only pays off if the consumer memoises their props is
 * worse than none, because it hides the requirement.
 */
export function PlayerConfigProvider({
  children,
  audioFile,
  customKeyboardShortcuts,
}: PlayerConfigProviderProps) {
  return (
    <PlayerConfigContext.Provider
      value={{ audioFile, customKeyboardShortcuts }}
    >
      {children}
    </PlayerConfigContext.Provider>
  );
}

export function usePlayerConfig(): PlayerConfig {
  const config = useContext(PlayerConfigContext);
  if (!config) {
    throw new Error(
      "usePlayerConfig must be used within a PlayerConfigProvider",
    );
  }
  return config;
}
