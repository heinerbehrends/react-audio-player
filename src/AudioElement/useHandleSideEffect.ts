import { useCallback, useContext } from "react";
import { AudioContext } from "./AudioContext";
import type { SideEffectAction } from "./sideEffectActions";
import { handleSideEffect } from "./handleSideEffect";

export function useHandleSideEffect() {
  const { audioElementRef } = useContext(AudioContext);
  return useCallback(
    (action: SideEffectAction) => {
      handleSideEffect(action, audioElementRef.current);
    },
    [audioElementRef],
  );
}
