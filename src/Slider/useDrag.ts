import { useContext, useEffect, useCallback } from "react";
import { TimelineContext } from "../Timeline/TimelineContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { PlayerContext } from "../Player/PlayerContext";

const switchContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

export function useDrag(type: "timeline" | "volume") {
  const { dragState, orientation } = useContext(switchContext[type]);
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);

  const onPointerUpTimeline = useOnPointerUpTimeline();
  const onPointerUpVolume = useOnPointerUpVolume();
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

  const onPointerMove = useOnPointerMove(type);
  const onPointerCancel = useOnPointerCancel();

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

function useOnPointerUpTimeline() {
  const { getPlayerState } = useContext(PlayerContext);
  const { handleTimelineAction, orientation, sliderLength, sliderStart } =
    useContext(TimelineContext);
  const { duration } = getPlayerState();

  return useCallback(
    (clientX: number) => {
      handleTimelineAction({
        type: "DRAG_END",
        component: "timeline",
        clientXY: clientX,
        duration,
        sliderLength,
        sliderStart,
        orientation,
      });
    },
    [handleTimelineAction, duration, sliderLength, sliderStart, orientation]
  );
}

function useOnPointerUpVolume() {
  const { handleTimelineAction, orientation, sliderLength, sliderStart } =
    useContext(VolumeContext);

  return useCallback(
    (clientXY: number) => {
      handleTimelineAction({
        type: "DRAG_END",
        component: "volume",
        clientXY,
        sliderLength,
        sliderStart,
        orientation,
      });
    },
    [handleTimelineAction, orientation, sliderLength, sliderStart]
  );
}

function useOnPointerMove(type: "timeline" | "volume") {
  const { getPlayerState } = useContext(PlayerContext);
  const { handleTimelineAction, orientation, sliderLength, sliderStart } =
    useContext(switchContext[type]);
  const { duration } = getPlayerState();
  return useCallback(
    (event: PointerEvent | TouchEvent) => {
      const clientXY = getClientXY(event, orientation);
      handleTimelineAction({
        type: "DRAG",
        component: type,
        clientXY,
        duration,
        sliderLength,
        sliderStart,
        orientation,
      });
    },
    [
      handleTimelineAction,
      type,
      duration,
      sliderLength,
      sliderStart,
      orientation,
    ]
  );
}

function useOnPointerCancel() {
  const { handleTimelineAction } = useContext(TimelineContext);

  return useCallback(() => {
    handleTimelineAction({
      type: "CANCEL_DRAG",
    });
  }, [handleTimelineAction]);
}
