/* eslint-disable react-refresh/only-export-components --
   The provider and its hook are one unit, and the context object stays private
   so the null-default guard below cannot be bypassed. */
import { createContext, useContext } from "react";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";
import type { PlayerLabels } from "../Shared/playerLabels";

/**
 * The track `<AudioPlayer>` plays. Changing `src` swaps it and returns the
 * player to loading.
 */
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
 * `AudioPlayer`'s static props, flowing strictly downward. None is state nor a
 * projection of the element, so none belongs in the store — but
 * `customKeyboardShortcuts` is read by seven components with no prop-drilling
 * path to them, and `labels` by nearly every one. Hence a context.
 */
export type PlayerConfig = {
  audioFile: AudioFile;
  customKeyboardShortcuts: KeyToActionMap | undefined;
  labels: PlayerLabels | undefined;
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
  labels,
}: PlayerConfigProviderProps) {
  return (
    <PlayerConfigContext.Provider
      value={{ audioFile, customKeyboardShortcuts, labels }}
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

/**
 * The consumer's `labels`, or `undefined`. Every control reads it, and every
 * control already imports this module through `useComposedButtonProps` or
 * `useSlider`, so nothing gains a module it did not have.
 *
 * There is no defaults object to merge against: each component keeps its own
 * English literal as the fallback, so a `PlayButton`-only bundle carries the
 * play names and nothing else (P1-a).
 */
export function useLabels(): PlayerLabels | undefined {
  return usePlayerConfig().labels;
}
