import { useContext, useEffect, useCallback } from "react";
import { TimelineContext } from "../Timeline/TimelineVolumeContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { AudioContext } from "../AudioElement/AudioContext";
import {
  calculateTime,
  calculateVolume,
  calculateVolumeDragEnd,
} from "../functionsLib";

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

  const onPointerUpTimeline = useCallback(
    (clientX: number) => {
      const time = calculateTime({
        xOffset: clientX,
        timelineWidth,
        timelineLeft,
        duration: audioElement?.duration ?? 0,
      });
      const duration = audioElement?.duration ?? 0;
      const restrictedTime = Math.min(Math.max(time, 0), duration);

      handleTimelineAction({
        type: "DRAG_END",
        time: restrictedTime,
        component: "timeline",
      });
    },
    [handleTimelineAction, timelineLeft, timelineWidth, audioElement]
  );

  const onPointerUpVolume = useCallback(
    (clientX: number) => {
      const time = calculateVolumeDragEnd({
        xOffset: clientX,
        timelineWidth,
        timelineLeft,
      });
      const restrictedTime = Math.min(Math.max(time, 0), 1);

      handleTimelineAction({
        type: "DRAG_END",
        time: restrictedTime,
        component: "volume",
      });
    },
    [handleTimelineAction, timelineWidth, timelineLeft]
  );

  const onPointerUp = useCallback(
    ({ clientX }: PointerEvent) => {
      if (type === "timeline") {
        onPointerUpTimeline(clientX);
      }
      if (type === "volume") {
        onPointerUpVolume(clientX);
      }
    },
    [type, onPointerUpTimeline, onPointerUpVolume]
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
      const restrictedTime =
        type === "timeline"
          ? Math.min(Math.max(time, 0), audioElement?.duration ?? 0)
          : Math.min(Math.max(time, 0), 1);

      const restrictedClientX = Math.min(
        Math.max(event.clientX, timelineLeft),
        timelineLeft + timelineWidth
      );
      handleTimelineAction({
        type: "DRAG",
        time: restrictedTime,
        clientX: restrictedClientX,
        component: type,
      });
    },
    [handleTimelineAction, type, timelineLeft, timelineWidth, audioElement]
  );

  const onPointerCancel = useCallback(() => {
    handleTimelineAction({
      type: "DRAG_END",
      time:
        type === "timeline"
          ? audioElement?.currentTime ?? 0
          : audioElement?.volume ?? 0,
      component: type,
    });
  }, [handleTimelineAction, type, audioElement]);

  useEffect(() => {
    if (dragState !== "dragging") {
      window.removeEventListener("pointermove", onPointerMove);
      return;
    }

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [dragState, onPointerUp, onPointerMove, onPointerCancel, audioElement]);
}
