import { useContext, useEffect } from "react";
import { AudioContext } from "../AudioElement/AudioContext";
import { SliderContext } from "./SliderContext";

export function useDrag({
  dragState,
  onPointerUp,
  onPointerMove,
  onPointerCancel,
}: {
  dragState: SliderContext["dragState"];
  onPointerUp: (event: PointerEvent | TouchEvent) => void;
  onPointerMove: (event: PointerEvent | TouchEvent) => void;
  onPointerCancel: () => void;
}) {
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);

  useEffect(() => {
    if (dragState !== "dragging") {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      return;
    }

    function handlePointerMove(event: PointerEvent | TouchEvent) {
      if (dragState !== "dragging") {
        return;
      }
      onPointerMove(event);
    }

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("touchmove", handlePointerMove);
    window.addEventListener("touchcancel", onPointerCancel);

    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchcancel", onPointerCancel);
    };
  }, [dragState, onPointerUp, onPointerMove, onPointerCancel, audioElement]);
}

