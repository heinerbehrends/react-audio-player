import { useReducer, useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import {
  TimelineContext,
  TimelineContextType,
  TimelineContextAction,
  initialState,
} from "./TimelineContext";
import { timelineReducer } from "./timelineReducer";

type TimelineProviderProps = {
  children: React.ReactNode;
};

export function TimelineProvider({ children }: TimelineProviderProps) {
  const { element } = useContext(PlayerContext);
  const [state, dispatch] = useReducer(
    (state: TimelineContextType, action: TimelineContextAction) =>
      timelineReducer(state, action, element),
    initialState
  );

  return (
    <TimelineContext.Provider value={{ ...state, dispatch }}>
      {children}
    </TimelineContext.Provider>
  );
}
