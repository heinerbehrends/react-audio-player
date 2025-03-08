import { useReducer } from "react";
import {
  TimelineContext,
  TimelineContextType,
  TimelineContextAction,
  initialState,
} from "./TimelineContext";
import { timelineReducer } from "./timelineReducer";

type TimelineProviderProps = {
  children: React.ReactNode;
  playerElement: HTMLAudioElement | null;
};

export function TimelineProvider({
  children,
  playerElement,
}: TimelineProviderProps) {
  const [state, dispatch] = useReducer(
    (state: TimelineContextType, action: TimelineContextAction) =>
      timelineReducer(state, action, playerElement),
    initialState
  );

  return (
    <TimelineContext.Provider value={{ ...state, dispatch }}>
      {children}
    </TimelineContext.Provider>
  );
}
