import { useContext, useEffect, useCallback } from "react";
import { TimelineContext } from "./Timeline/TimelineContext";
import { VolumeContext } from "./Volume/VolumeContext";

const mapContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

export function useDrag(type: "timeline" | "volume") {
  const { dragState, dispatch } = useContext(mapContext[type]);

  const onPointerUp = useCallback(
    ({ clientX }: PointerEvent) => {
      dispatch({
        type: "DRAG_END",
        clientX,
      });
    },
    [dispatch]
  );

  const onPointerMove = useCallback(
    ({ clientX }: PointerEvent) => {
      dispatch({ type: "DRAG", clientX });
    },
    [dispatch]
  );

  useEffect(() => {
    if (dragState !== "dragging") return;

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [dragState, onPointerUp, onPointerMove]);

  return { dragState, dispatch };
}
