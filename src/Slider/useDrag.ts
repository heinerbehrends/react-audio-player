import { useContext, useEffect } from "react";
import { AudioContext } from "../AudioElement/AudioContext";
import { SliderContext } from "./SliderContext";
import { SliderEvent } from "./sliderHooks";

export function useDrag({
  context,
  onPointerUp,
  onPointerMove,
  onPointerCancel,
}: {
  context: SliderContext;
  onPointerUp: (event: PointerEvent | TouchEvent) => void;
  onPointerMove: (event: PointerEvent | TouchEvent) => void;
  onPointerCancel: () => void;
}) {
  const { dragState } = context;
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

function isTouchEvent(
  event: SliderEvent
): event is React.TouchEvent<HTMLButtonElement> {
  return "touches" in event;
}

export function getClientXY(
  event: SliderEvent,
  orientation: "horizontal" | "vertical"
): number {
  if (isTouchEvent(event)) {
    return orientation === "horizontal"
      ? event.touches[0]?.clientX ?? 0
      : event.touches[0]?.clientY ?? 0;
  }
  return orientation === "horizontal" ? event.clientX : event.clientY;
}
