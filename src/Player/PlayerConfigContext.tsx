/* eslint-disable react-refresh/only-export-components --
   The provider and its hook are one unit, and the context object stays private
   so the null-default guard below cannot be bypassed. */
import { createContext, memo, useContext, useMemo } from "react";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";

export type AudioFile = {
  src: string;
};

/**
 * Static config: `AudioPlayer`'s two props, flowing strictly downward. Neither
 * is state and neither is a projection of the element, so no atom wants them —
 * but `audioFiles` is read by `AudioElement` and `customKeyboardShortcuts` by
 * `useHandleMediaKeys`, which seven components call, and there is no
 * prop-drilling path to `SetSliderValue`. Hence a context, not the store.
 */
export type PlayerConfig = {
  audioFiles: AudioFile[];
  customKeyboardShortcuts: KeyToActionMap | undefined;
};

// No default value, for the reason `PlayerStoreContext` has none: a default is
// why `AudioContext`'s `if (!context)` guard can never fire.
const PlayerConfigContext = createContext<PlayerConfig | null>(null);
PlayerConfigContext.displayName = "PlayerConfigContext";

type PlayerConfigProviderProps = PlayerConfig & {
  children: React.ReactNode;
};

/** The value changes only when the consumer changes props. */
export const PlayerConfigProvider = memo(function PlayerConfigProvider({
  children,
  audioFiles,
  customKeyboardShortcuts,
}: PlayerConfigProviderProps) {
  const config = useMemo(
    () => ({ audioFiles, customKeyboardShortcuts }),
    [audioFiles, customKeyboardShortcuts],
  );

  return (
    <PlayerConfigContext.Provider value={config}>
      {children}
    </PlayerConfigContext.Provider>
  );
});

export function usePlayerConfig(): PlayerConfig {
  const config = useContext(PlayerConfigContext);
  if (!config) {
    throw new Error(
      "usePlayerConfig must be used within a PlayerConfigProvider",
    );
  }
  return config;
}
