import { useReducer } from "react";
import {
  PlayerContext,
  PlayerContextType,
  PlayerContextAction,
  initialState,
} from "./PlayerContext";

export function PlayerContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(playerReducer, initialState);

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
  }
}
