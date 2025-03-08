import { useContext, useReducer } from "react";
import { VolumeContext, initialState } from "./VolumeContext";
import { PlayerContext } from "../Player/PlayerContext";
import { volumeReducer } from "./volumeReducer";
import type {
  TimelineContextAction,
  TimelineContextType,
} from "../Timeline/TimelineContext";

export function VolumeProvider({ children }: { children: React.ReactNode }) {
  const { element: playerElement } = useContext(PlayerContext);
  const [state, dispatch] = useReducer(
    (state: TimelineContextType, action: TimelineContextAction) =>
      volumeReducer(state, action, playerElement),
    initialState
  );

  return (
    <VolumeContext.Provider value={{ ...state, dispatch }}>
      {children}
    </VolumeContext.Provider>
  );
}
