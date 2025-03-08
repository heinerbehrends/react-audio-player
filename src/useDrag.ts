import { useContext, useEffect } from "react";
import { TimelineContext } from "./Timeline/TimelineContext";
import { VolumeContext } from "./Volume/VolumeContext";

const mapContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

export function useDrag(type: "timeline" | "volume") {
  const { dragState, dispatch } = useContext(mapContext[type]);
  useEffect(() => {
    if (dragState !== "dragging") return;

    function onPointerUp({ clientX }: PointerEvent) {
      dispatch({
        type: "DRAG_END",
        clientX,
      });
    }
    function onPointerMove({ clientX }: PointerEvent) {
      dispatch({ type: "DRAG", clientX });
    }

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [dragState, dispatch]);
}
