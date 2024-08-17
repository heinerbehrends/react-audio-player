import { useEffect, useRef, useState } from "react";
import { AudioPlayerContext } from "./AudioPlayerContext";
import { LoopMarkers } from "./LoopMarkers";

const { useSelector, useActorRef } = AudioPlayerContext;

export function TimeLine() {
  const timelineRef = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<DOMRect | undefined>(undefined);
  const {
    duration,
    dragStateTimeline,
    dragStateStart,
    dragStateEnd,
    dragXOffset,
    timelineLeft,
    timelineWidth,
    currentTime,
  } = useSelector((state) => ({
    duration: state.context?.ref?.duration,
    dragStateTimeline: state.value.dragTimeline,
    dragStateStart: state.value.dragLoopStart,
    dragStateEnd: state.value.dragLoopEnd,
    dragXOffset: state.context.dragXOffset,
    timelineLeft: state.context.timelineLeft,
    timelineWidth: state.context.timelineWidth,
    currentTime: state.context?.position,
  }));

  const elapsedPercentage = (currentTime / (duration ?? 1)) * 100;

  const { send } = useActorRef();

  useEffect(() => {
    const body = document.querySelector("body");

    function onMouseUp() {
      if (dragStateStart === "dragging" || dragStateEnd === "dragging") {
        console.log("send drag end", dragXOffset);
        const relativeTime = 
          (((dragXOffset ?? 0) - (timelineLeft ?? 0)) / (timelineWidth || 1)) *
          (duration ?? 1);
        send({ type: "DRAG_END", time: relativeTime });
      }
      const time =
        (((dragXOffset ?? 0) - (timelineLeft ?? 0)) / (timelineWidth || 1)) *
        (duration ?? 1);
      send({ type: "DRAG_END", time });
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

  useEffect(() => {
    const rect = timelineRef.current?.getBoundingClientRect();
    setRect(rect);
    send({
      type: "TIMELINE_LOADED",
      timelineLeft: rect?.left ?? 0,
      timelineWidth: rect?.width ?? 1,
    });
  }, []);

  return (
    <div>
      <button
        style={{
          width: "100%",
          appearance: "none",
          border: "none",
          padding: 0,
        }}
        ref={timelineRef}
        onClick={(event) => {
          const x = event.clientX - (rect?.left ?? 0);
          const percentage = (x / (rect?.width ?? 1)) * 100;
          send({ type: "SEEK", time: (percentage / 100) * (duration ?? 1) });
        }}
      >
        <div
          style={{
            width: "100%",
            height: "10px",
            backgroundColor: "lightgray",
            position: "relative",
          }}
        >
          <div
            style={{
              width:
                dragStateTimeline === "dragging"
                  ? `${dragXOffset}px`
                  : `${elapsedPercentage}%`,
              height: "100%",
              backgroundColor: "blue",
            }}
          />
        </div>
      </button>
      <button
        style={{
          position: "absolute",
          display: "hidden",

          left:
            dragStateTimeline === "dragging"
              ? `${dragXOffset}px`
              : `${elapsedPercentage}%`,
          top: "7.5px",
          appearance: "none",
          border: "none",
          backgroundColor: "transparent",
          height: "20px",
          width: "20px",
          borderRadius: "50%",
        }}
        onMouseDown={(event) => {
          const x = event.clientX;
          send?.({
            type: "DRAG_START",
            x,
            element: "timeline",
          });
        }}
      />
      <LoopMarkers />
    </div>
  );
}
