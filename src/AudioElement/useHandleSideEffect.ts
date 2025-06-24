import { useCallback } from "react";
import { useAudioContext } from "./AudioContext";
import type { SideEffectAction } from "./sideEffectActions";
import { handleSideEffect } from "./handleSideEffect";

export function useHandleSideEffect() {
  const { audioElementRef } = useAudioContext();
  return useCallback(
    (action: SideEffectAction) => {
      handleSideEffect(action, audioElementRef.current);
    },
    [audioElementRef],
  );
}
