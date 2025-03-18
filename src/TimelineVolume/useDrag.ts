import { useContext, useEffect, useCallback } from "react";
import { TimelineContext } from "../Timeline/TimelineVolumeContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { calculateTime, calculateVolume } from "../functionsLib";

const mapContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

export function useDrag(type: "timeline" | "volume") {
  const { dragState, handleTimelineAction, timelineLeft, timelineWidth } =
    useContext(mapContext[type]);
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
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
      handleTimelineAction({
        type: "DRAG_END",
        time,
        component: type,
      });
    },
    [handleTimelineAction, type, timelineLeft, timelineWidth, audioElement]
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
      handleTimelineAction({
        type: "DRAG",
        time,
        clientX: event.clientX,
        component: type,
      });
    },
    [handleTimelineAction, type, timelineLeft, timelineWidth, audioElement]
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
  }, [dragState, onPointerUp, onPointerMove, audioElement]);
}
