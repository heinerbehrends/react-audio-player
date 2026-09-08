/* eslint-disable react-refresh/only-export-components --
   The provider and its hook are one unit, and the context object stays private
   so the null-default guard below cannot be bypassed. */
import { createContext, useContext } from "react";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";

export type AudioFile = {
  src: string;
  /**
   * Track metadata. Nothing reads these yet; they are declared now so that
   * adding Media Session support later is not a breaking change to the one type
   * every consumer passes to their root component.
   */
  title?: string;
  artist?: string;
  album?: string;
  artwork?: MediaImage[];
};

/**
 * `AudioPlayer`'s two static props, flowing strictly downward. Neither is state
 * nor a projection of the element, so neither belongs in the store — but
 * `customKeyboardShortcuts` is read by seven components with no prop-drilling
 * path to them. Hence a context.
 */
export type PlayerConfig = {
  audioFile: AudioFile;
  customKeyboardShortcuts: KeyToActionMap | undefined;
};

// No default value: with one, the guard in `usePlayerConfig` could never fire.
const PlayerConfigContext = createContext<PlayerConfig | null>(null);
PlayerConfigContext.displayName = "PlayerConfigContext";

type PlayerConfigProviderProps = PlayerConfig & {
  children: React.ReactNode;
};

/**
 * Deliberately unmemoised. The documented usage passes `audioFile` as an inline
 * object literal, so a `memo` comparison and a `useMemo` dependency check would
 * both fail on every consumer render and buy nothing. The cost when they bail
 * is seven cheap components rendering.
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
