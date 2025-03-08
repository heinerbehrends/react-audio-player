import { useReducer } from "react";
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

export function PlayerContextProvider({
  children,
  audioFiles,
}: PlayerContextProviderProps) {
  const [state, dispatch] = useReducer(playerReducer, {
    ...initialState,
    audioFiles,
  });

  return (
    <PlayerContext.Provider value={{ ...state, dispatch }}>
      {children}
    </PlayerContext.Provider>
  );
}

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
  }
}
