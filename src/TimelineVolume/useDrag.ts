import { useContext, useEffect, useCallback } from "react";
import { TimelineContext } from "../Timeline/TimelineVolumeContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { AudioContext } from "../AudioElement/AudioContext";
import {
  calculateTime,
  calculateVolume,
  calculateVolumeDragEnd,
} from "../functionsLib";
import { PlayerContext } from "../Player/PlayerContext";

const mapContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

export function useDrag(type: "timeline" | "volume") {
  const { dragState, handleTimelineAction, sliderStart, sliderLength } =
    useContext(mapContext[type]);
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const { getPlayerState } = useContext(PlayerContext);
  const { duration, currentTime, volume } = getPlayerState();

  const onPointerUpTimeline = useCallback(
    (clientX: number) => {
      const time = calculateTime({
        xOffset: clientX,
        sliderLength,
        sliderStart,
        duration,
      });
      const restrictedTime = Math.min(Math.max(time, 0), duration);

      handleTimelineAction({
        type: "DRAG_END",
        time: restrictedTime,
        component: "timeline",
      });
    },
    [handleTimelineAction, sliderStart, sliderLength, duration]
  );

  const onPointerUpVolume = useCallback(
    (clientX: number) => {
      const time = calculateVolumeDragEnd({
        xOffset: clientX,
        sliderLength,
        sliderStart,
      });
      const restrictedTime = Math.min(Math.max(time, 0), 1);

      handleTimelineAction({
        type: "DRAG_END",
        time: restrictedTime,
        component: "volume",
      });
    },
    [handleTimelineAction, sliderLength, sliderStart]
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
    (event: PointerEvent | TouchEvent) => {
      const clientX = getClientX(event);
      const time =
        type === "timeline"
          ? calculateTime({
              xOffset: clientX,
              sliderLength,
              sliderStart,
              duration,
            })
          : calculateVolume({
              xOffset: clientX,
              sliderLength,
            });
      const restrictedTime =
        type === "timeline"
          ? Math.min(Math.max(time, 0), duration)
          : Math.min(Math.max(time, 0), 1);

      const restrictedClientX = Math.min(
        Math.max(clientX, sliderStart),
        sliderStart + sliderLength
      );
      handleTimelineAction({
        type: "DRAG",
        time: restrictedTime,
        clientX: restrictedClientX,
        component: type,
      });
    },
    [handleTimelineAction, type, sliderStart, sliderLength, duration]
  );

  const onPointerCancel = useCallback(() => {
    handleTimelineAction({
      type: "DRAG_END",
      time: type === "timeline" ? currentTime : volume,
      component: type,
    });
  }, [handleTimelineAction, type, currentTime, volume]);

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

export function getClientX(event: PointerEvent | TouchEvent): number {
  if (isTouchEvent(event)) {
    return event.touches[0]?.clientX ?? 0;
  }
  return event.clientX;
}
