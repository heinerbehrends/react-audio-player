import { useMemo, useReducer, memo } from "react";
import { VolumeContext, initialState } from "./VolumeContext";
import { volumeReducer } from "./volumeReducer";

export const VolumeProvider = memo(function VolumeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(volumeReducer, initialState);

  const value = useMemo(() => ({ ...state, dispatch }), [state]);

  return (
    <VolumeContext.Provider value={value}>{children}</VolumeContext.Provider>
  );
});
