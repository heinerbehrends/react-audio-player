import { useReducer, useContext, useMemo, useCallback } from "react";
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

  const reducer = useCallback(
    (state: TimelineContextType, action: TimelineContextAction) =>
      timelineReducer(state, action, element),
    [element]
  );

  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo(() => ({ ...state, dispatch }), [state]);

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}
