import { useRef } from "react";
import { useAudioPlayer } from "../logic/useAudioPlayer";
import { AudioPlayerContext } from "./AudioPlayerContext";

export function TimeLine() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rect = buttonRef.current?.getBoundingClientRect();
  const {
    elapsedPercentage,
    duration,
    sendToDrag,
    dragXOffset,
    dragMachineState,
  } = useAudioPlayer();
  const { send } = AudioPlayerContext.useActorRef();

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
                dragMachineState === "dragging"
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
            dragMachineState === "dragging"
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
          console.log("x", x);
          sendToDrag?.({
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
