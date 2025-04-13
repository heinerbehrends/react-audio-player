import { useContext, useEffect } from "react";
import { TimelineContextType } from "../Timeline/TimelineContext";
import { VolumeContextType } from "../Volume/VolumeContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { PlaybackRateContextType } from "../PlaybackRate/PlaybackRateContext";

type UseDragProps = {
  context: TimelineContextType | VolumeContextType | PlaybackRateContextType;
  onPointerUp: (event: PointerEvent | TouchEvent) => void;
  onPointerMove: (event: PointerEvent | TouchEvent) => void;
  onPointerCancel: () => void;
};

export function useDrag({
  context,
  onPointerUp,
  onPointerMove,
  onPointerCancel,
}: UseDragProps) {
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

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("touchmove", onPointerMove);
    window.addEventListener("touchcancel", onPointerCancel);

    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchcancel", onPointerCancel);
    };
  }, [dragState, onPointerUp, onPointerMove, onPointerCancel, audioElement]);
}

function isTouchEvent(event: PointerEvent | TouchEvent): event is TouchEvent {
  return "touches" in event;
}

export function getClientXY(
  event: PointerEvent | TouchEvent,
  orientation: "horizontal" | "vertical"
): number {
  if (isTouchEvent(event)) {
    return orientation === "horizontal"
      ? event.touches[0]?.clientX ?? 0
      : event.touches[0]?.clientY ?? 0;
  }
  return orientation === "horizontal" ? event.clientX : event.clientY;
}
