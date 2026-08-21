import { useMemo, useReducer, memo } from "react";
import {
  initialPlayerState,
  PlayerContext,
  type PlayerContextType,
} from "./PlayerContext";
import { playerReducer } from "./playerReducer";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";
import type { AudioFile } from "./PlayerConfigContext";

type PlayerContextProviderProps = {
  children: React.ReactNode;
  audioFiles: AudioFile[];
  customKeyboardShortcuts: KeyToActionMap | undefined;
};

export const PlayerContextProvider = memo(function PlayerContextProvider({
  children,
  audioFiles,
  customKeyboardShortcuts,
}: PlayerContextProviderProps) {
  const [state, dispatch] = useReducer(playerReducer, {
    ...initialPlayerState,
    audioFiles,
    customKeyboardShortcuts,
  });

  const value = useMemo(
    () =>
      ({
        ...state,
        handlePlayerAction: dispatch,
      }) satisfies PlayerContextType,
    [state],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
});
