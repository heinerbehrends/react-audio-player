import { useEffect, useRef } from "react";
import { AudioPlayerContext } from "./AudioPlayerContext";

export function TimeLine() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rect = buttonRef.current?.getBoundingClientRect();
  const duration = AudioPlayerContext.useSelector(
    (state) => state.context?.ref?.duration
  );
  const dragState = AudioPlayerContext.useSelector((state) => state.value.drag);

  const dragXOffset = AudioPlayerContext.useSelector(
    (state) => state.context.dragXOffset
  );
  const timelineLeft = AudioPlayerContext.useSelector(
    (state) => state.context.timelineLeft
  );
  const timelineWidth = AudioPlayerContext.useSelector(
    (state) => state.context.timelineWidth
  );
  const currentTime = AudioPlayerContext.useSelector(
    (state) => state.context?.position
  );
  const elapsedPercentage = (currentTime / (duration ?? 1)) * 100;

  const { send } = AudioPlayerContext.useActorRef();

  useEffect(() => {
    const body = document.querySelector("body");

    function onMouseUp() {
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
  }, [send, dragXOffset, timelineWidth, timelineLeft, duration]);

  return (
    <div>
      <button
        style={{
          width: "100%",
          appearance: "none",
          border: "none",
          padding: 0,
        }}
        ref={buttonRef}
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
                dragState === "dragging"
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
          left:
            dragState === "dragging"
              ? `${dragXOffset}px`
              : `${elapsedPercentage}%`,
          transform: "translateX(-50%)",
          top: "7.5px",
          appearance: "none",
          border: "none",
          backgroundColor: "hotpink",
          height: "20px",
          width: "20px",
          borderRadius: "50%",
        }}
        onMouseDown={(event) => {
          const x = event.clientX;
          send?.({
            type: "DRAG_START",
            x,
            timelineLeft: rect?.left,
            timelineWidth: rect?.width,
          });
        }}
      />
    </div>
  );
}
