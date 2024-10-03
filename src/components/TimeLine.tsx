import { useEffect, useRef, useState } from "react";
import { AudioPlayerContext } from "./AudioPlayerContext";
import { LoopMarkers } from "./LoopMarkers";

const { useSelector, useActorRef } = AudioPlayerContext;

export function TimeLine() {
  const timelineRef = useRef<HTMLButtonElement>(null);
  const {
    duration,
    dragStateTimeline,
    dragXOffset,
    currentTime,
    timelineLeft,
  } = useSelector((state) => ({
    duration: state.context?.ref?.duration ?? 1,
    dragStateTimeline: state.value.dragTimeline,
    dragXOffset: state.context.dragXOffset,
    currentTime: state.context?.position,
    timelineLeft: state.context.timelineLeft ?? 0,
  }));

  const elapsedPercentage = (currentTime / duration) * 100;

  const { send } = useActorRef();

  useDrag();

  const rect = useTimelineLoaded(timelineRef);

  return (
    <div>
      <button
        style={{
          position: "relative",
          left:
            dragStateTimeline === "dragging"
              ? `${dragXOffset - timelineLeft}px`
              : `${elapsedPercentage}%`,
          top: "20px",
          marginLeft: "-10px",
          appearance: "none",
          border: "none",
          backgroundColor: "hotpink",
          height: "20px",
          width: "20px",
          borderRadius: "50%",
        }}
        onMouseDown={(event) => {
          const x = event.clientX;
          send({
            type: "DRAG_START",
            x,
            element: "timeline",
          });
        }}
      />

      <button
        style={{
          width: "100%",
          appearance: "none",
          border: "none",
          padding: 0,
          marginBottom: "20px",
        }}
        ref={timelineRef}
        onClick={(event) => {
          const x = event.clientX - rect.left;
          const percentage = (x / rect.width) * 100;
          send({ type: "SEEK", time: (percentage / 100) * duration });
        }}
      >
        <div
          style={{
            width: "100%",
            height: "10px",
            backgroundColor: "lightgray",
          }}
        >
          <div
            style={{
              width:
                dragStateTimeline === "dragging"
                  ? `${dragXOffset - timelineLeft}px`
                  : `${elapsedPercentage}%`,
              height: "100%",
              backgroundColor: "blue",
            }}
          />
        </div>
      </button>
      <LoopMarkers />
    </div>
  );
}

function getRelativeTime(
  dragXOffset: number,
  timelineLeft: number,
  timelineWidth: number,
  duration: number
) {
  return ((dragXOffset - timelineLeft) / timelineWidth) * duration;
}

function useDrag() {
  const { send } = useActorRef();
  const {
    dragXOffset,
    timelineWidth,
    timelineLeft,
    duration,
    dragStateEnd,
    dragStateStart,
  } = useSelector((state) => ({
    dragXOffset: state.context.dragXOffset,
    timelineWidth: state.context.timelineWidth ?? 1,
    timelineLeft: state.context.timelineLeft ?? 0,
    duration: state.context.ref?.duration ?? 1,
    dragStateEnd: state.value.dragLoopEnd,
    dragStateStart: state.value.dragLoopStart,
  }));
  useEffect(() => {
    const body = document.querySelector("body");

    function onMouseUp() {
      const relativeTime = getRelativeTime(
        dragXOffset,
        timelineLeft,
        timelineWidth,
        duration
      );
      if (dragStateStart === "dragging" || dragStateEnd === "dragging") {
        send({ type: "DRAG_END", time: relativeTime });
      }
      send({ type: "DRAG_END", time: relativeTime });
    }

    function onMouseMove(event: MouseEvent) {
      send({ type: "DRAG", x: event.clientX });
    }

    if (!body) return;

    body.style.height = "100vh";
    body.addEventListener("mouseup", onMouseUp);
    body.addEventListener("mousemove", onMouseMove);

    return () => {
      body.removeEventListener("mouseup", onMouseUp);
      body.removeEventListener("mousemove", onMouseMove);
    };
  }, [
    send,
    dragXOffset,
    timelineWidth,
    timelineLeft,
    duration,
    dragStateEnd,
    dragStateStart,
  ]);
}

function useTimelineLoaded(
  timelineRef: React.RefObject<HTMLButtonElement>
): DOMRect {
  const [rect, setRect] = useState<DOMRect | undefined>(undefined);
  const { send } = useActorRef();
  useEffect(() => {
    const rect = timelineRef.current?.getBoundingClientRect();
    setRect(rect);
    send({
      type: "TIMELINE_LOADED",
      timelineLeft: rect?.left ?? 0,
      timelineWidth: rect?.width ?? 1,
    });
  }, [send, timelineRef]);
  return rect ?? new DOMRect(0, 0, 1, 1);
}
