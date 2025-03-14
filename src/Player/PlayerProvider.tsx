import { useMemo, useReducer, memo, useCallback } from "react";
import {
  PlayerContext,
  PlayerContextType,
  PlayerContextAction,
  initialState,
} from "./PlayerContext";
import { playerReducer } from "./playerReducer";
import { AudioContextProvider } from "../AudioElement/AudioContextProvider";

type PlayerContextProviderProps = {
  children: React.ReactNode;
  audioFiles: { src: string; captionSrc?: string }[];
};

export const PlayerContextProvider = memo(function PlayerContextProvider({
  children,
  audioFiles,
}: PlayerContextProviderProps) {
  const reducer = useCallback(
    (state: PlayerContextType, action: PlayerContextAction) =>
      playerReducer(state, action),
    []
  );

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    audioFiles,
  });

  const value = useMemo(() => ({ ...state, dispatch }), [state]);

  return (
    <AudioContextProvider>
      <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
    </AudioContextProvider>
  );
});
