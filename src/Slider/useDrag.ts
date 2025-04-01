import { useContext, useEffect, useCallback } from "react";
import { TimelineContext } from "../Timeline/TimelineContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { calculateTime, calculateVolume } from "../functionsLib";
import { PlayerContext } from "../Player/PlayerContext";

const mapContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

export function useDrag(type: "timeline" | "volume") {
  const {
    dragState,
    handleTimelineAction,
    sliderStart,
    sliderLength,
    orientation,
  } = useContext(mapContext[type]);
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const { getPlayerState } = useContext(PlayerContext);
  const { duration, currentTime, volume } = getPlayerState();

  const onPointerUpTimeline = useCallback(
    (clientX: number) => {
      const time = calculateTime({
        xyOffset: clientX,
        sliderLength,
        sliderStart,
        duration,
      });
      const restrictedTime = Math.min(Math.max(time, 0), duration);

      handleTimelineAction({
        type: "DRAG_END",
        value: restrictedTime,
        component: "timeline",
      });
    },
    [handleTimelineAction, sliderStart, sliderLength, duration]
  );

  const onPointerUpVolume = useCallback(
    (clientXY: number) => {
      const time = calculateVolume({
        xyOffset: clientXY,
        sliderLength,
        sliderStart,
        orientation,
      });
      const restrictedTime = Math.min(Math.max(time, 0), 1);

      handleTimelineAction({
        type: "DRAG_END",
        value: restrictedTime,
        component: "volume",
      });
    },
    [handleTimelineAction, sliderLength, sliderStart, orientation]
  );

  const onPointerUp = useCallback(
    ({ clientX, clientY }: PointerEvent) => {
      const clientXY = orientation === "horizontal" ? clientX : clientY;
      if (type === "timeline") {
        onPointerUpTimeline(clientXY);
      }
      if (type === "volume") {
        onPointerUpVolume(clientXY);
      }
    },
    [type, onPointerUpTimeline, onPointerUpVolume, orientation]
  );

  const onPointerMove = useCallback(
    (event: PointerEvent | TouchEvent) => {
      console.log("onPointerMove", event);
      const clientXY = getClientXY(event, orientation);
      console.log("clientXY", clientXY);
      const value =
        type === "timeline"
          ? calculateTime({
              xyOffset: clientXY,
              sliderLength,
              sliderStart,
              duration,
            })
          : calculateVolume({
              xyOffset: clientXY,
              sliderLength,
              sliderStart,
              orientation,
            });
      console.log("time", value);
      const restrictedValue =
        type === "timeline"
          ? Math.min(Math.max(value, 0), duration)
          : Math.min(Math.max(value, 0), 1);
      console.log("restrictedTime", restrictedValue);
      const restrictedClientXY = Math.min(
        Math.max(clientXY, sliderStart),
        sliderStart + sliderLength
      );
      console.log("restrictedClientXY", restrictedClientXY);

      handleTimelineAction({
        type: "DRAG",
        time: restrictedValue,
        clientXY: restrictedClientXY,
        component: type,
      });
    },
    [
      handleTimelineAction,
      type,
      sliderStart,
      sliderLength,
      duration,
      orientation,
    ]
  );

  const onPointerCancel = useCallback(() => {
    handleTimelineAction({
      type: "DRAG_END",
      value: type === "timeline" ? currentTime : volume,
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
