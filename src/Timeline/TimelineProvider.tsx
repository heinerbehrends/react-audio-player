import { useReducer, useMemo } from "react";
import { TimelineContext, initialState } from "./TimelineContext";
import { timelineReducer } from "./timelineReducer";

type TimelineProviderProps = {
  children: React.ReactNode;
};

export function TimelineProvider({ children }: TimelineProviderProps) {
  const [state, dispatch] = useReducer(timelineReducer, initialState);

  const value = useMemo(() => ({ ...state, dispatch }), [state]);

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}
