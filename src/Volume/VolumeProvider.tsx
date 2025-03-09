import { useContext, useMemo, useReducer, memo, useCallback } from "react";
import { VolumeContext, initialState } from "./VolumeContext";
import { PlayerContext } from "../Player/PlayerContext";
import { volumeReducer } from "./volumeReducer";
import type {
  TimelineContextAction,
  TimelineContextType,
} from "../Timeline/TimelineContext";

export const VolumeProvider = memo(function VolumeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { element: playerElement } = useContext(PlayerContext);

  const reducer = useCallback(
    (state: TimelineContextType, action: TimelineContextAction) =>
      volumeReducer(state, action, playerElement),
    [playerElement]
  );

  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo(() => ({ ...state, dispatch }), [state]);

  return (
    <VolumeContext.Provider value={value}>{children}</VolumeContext.Provider>
  );
});
