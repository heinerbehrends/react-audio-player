import { useContext, useEffect, useCallback } from "react";
import { TimelineContext } from "./Timeline/TimelineContext";
import { VolumeContext } from "./Volume/VolumeContext";
import { AudioContext } from "./AudioElement/AudioContext";
import { calculateVolume } from "./functionsLib";

const mapContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

export function useDrag(type: "timeline" | "volume") {
  const { dragState, dispatch, timelineLeft, timelineWidth } = useContext(
    mapContext[type]
  );
  const { audioElement, handleSideEffect } = useContext(AudioContext);
  const onPointerUp = useCallback(
    ({ clientX }: PointerEvent) => {
      const time =
        type === "timeline"
          ? calculateTime({
              xOffset: clientX,
              timelineWidth,
              timelineLeft,
              duration: audioElement?.duration ?? 0,
            })
          : calculateVolume({
              xOffset: clientX,
              timelineWidth,
            });
      handleSideEffect(
        {
          type: "DRAG_END",
          time,
          component: type,
        },
        audioElement
      );
      dispatch({
        type: "DRAG_END",
        time,
        component: type,
      });
    },
    [
      dispatch,
      handleSideEffect,
      type,
      timelineLeft,
      timelineWidth,
      audioElement,
    ]
  );

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const time =
        type === "timeline"
          ? calculateTime({
              xOffset: event.clientX,
              timelineWidth,
              timelineLeft,
              duration: audioElement?.duration ?? 0,
            })
          : calculateVolume({
              xOffset: event.clientX,
              timelineWidth,
            });
      dispatch({ type: "DRAG", time, clientX: event.clientX });
      if (type === "timeline") {
        return;
      }
      console.log("dragging volume", handleSideEffect);
      handleSideEffect(
        { type: "DRAG", time, clientX: event.clientX },
        audioElement
      );
    },
    [
      dispatch,
      type,
      timelineLeft,
      timelineWidth,
      handleSideEffect,
      audioElement,
    ]
  );

  useEffect(() => {
    if (dragState !== "dragging") {
      window.removeEventListener("pointermove", onPointerMove);
      return;
    }

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [dragState, onPointerUp, onPointerMove, handleSideEffect, audioElement]);

  return { dragState, dispatch };
}

type CalculateTimeArgs = {
  xOffset: number;
  timelineWidth: number;
  timelineLeft: number;
  duration: number;
};

export function calculateTime({
  xOffset,
  timelineWidth,
  timelineLeft,
  duration,
}: CalculateTimeArgs): number {
  const progress = (xOffset - timelineLeft) / timelineWidth;
  return progress * duration;
}
