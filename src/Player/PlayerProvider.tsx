import { useMemo, useReducer, memo, useCallback } from "react";
import {
  initialPlayerState,
  PlayerContext,
  type PlayerContextAction,
  type PlayerContextType,
} from "./PlayerContext";
import { playerReducer } from "./playerReducer";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";

type PlayerContextProviderProps = {
  children: React.ReactNode;
  audioFiles: AudioFile[];
  customKeyboardShortcuts: KeyToActionMap | undefined;
};

export type AudioFile = {
  src: string;
  captionSrc?: string;
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

  const handlePlayerAction = useCallback(
    (action: PlayerContextAction) => {
      dispatch(action);
    },
    [dispatch],
  );

  const value = useMemo(
    () =>
      ({
        ...state,
        handlePlayerAction,
      }) satisfies PlayerContextType,
    [state, handlePlayerAction],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
});
