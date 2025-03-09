import { useMemo, useReducer, memo, useCallback } from "react";
import {
  PlayerContext,
  PlayerContextType,
  PlayerContextAction,
  initialState,
} from "./PlayerContext";

type PlayerContextProviderProps = {
  children: React.ReactNode;
  audioFiles: string[];
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
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
});

function playerReducer(state: PlayerContextType, action: PlayerContextAction) {
  switch (action.type) {
    case "AUDIO_FILE_LOADED":
      if (state.player === "loading") {
        return { ...state, player: "paused" as const, element: action.element };
      }
      return state;
    case "TOGGLE_PLAY":
      if (state.player === "playing") {
        state.element?.pause();
        return { ...state, player: "paused" as const };
      }
      if (state.player === "paused") {
        state.element?.play();
        return { ...state, player: "playing" as const };
      }
      return state;
    case "TOGGLE_MUTE":
      return { ...state, isMuted: !state.isMuted };
    case "AUDIO_FILE_ENDED":
      if (!state.element) {
        return state;
      }
      state.element.currentTime = 0;
      return { ...state, player: "paused" as const, time: 0 };
    case "TOGGLE_TIME_DISPLAY":
      return {
        ...state,
        timeDisplay:
          state.timeDisplay === "elapsed"
            ? ("remaining" as const)
            : ("elapsed" as const),
      };
  }
}
