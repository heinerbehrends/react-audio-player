import { useEffect } from "react";
import { useAudioPlayer } from "../logic/useAudioPlayer";
import { AudioElement } from "./AudioElement";
import { DisplayState } from "./DisplayState";
import { ElapsedRemaining } from "./ElapsedRemaining";
import { PlayButton } from "./PlayButton";
import { TimeLine } from "./TimeLine";

export function AudioPlayer() {
  const {
    isPlaying,
    sendToDrag,
    timelineLeft,
    timelineWidth,
    dragXOffset,
    duration,
  } = useAudioPlayer();
  useEffect(() => {
    const body = document.querySelector("body");
    function onMouseUpPartial(
      sendFunction:
        | ((event: { type: "DRAG_END"; time: number }) => void)
        | undefined
    ) {
      return () => {
        console.log("dragXOffset", dragXOffset);
        console.log("timelineWidth", timelineWidth);
        console.log("timelineLeft", timelineLeft);
        const time =
          (((dragXOffset ?? 0) - (timelineLeft ?? 0)) / (timelineWidth ?? 1)) *
          (duration ?? 1);
        console.log("time", time);
        sendFunction && sendFunction({ type: "DRAG_END", time });
      };
    }
    function onMouseMovePartial(
      sendFunction: ((event: { type: "DRAG"; x: number }) => void) | undefined
    ) {
      return (event: MouseEvent) => {
        sendFunction && sendFunction({ type: "DRAG", x: event.clientX });
      };
    }
    const onMouseUp = onMouseUpPartial(sendToDrag);
    const onMouseMove = onMouseMovePartial(sendToDrag);
    if (!body) return;
    body.style.height = "100vh";
    body.addEventListener("mouseup", onMouseUp);
    body.addEventListener("mousemove", onMouseMove);
    return () => {
      body.removeEventListener("mouseup", onMouseUp);
      body.removeEventListener("mousemove", onMouseMove);
    };
  }, [sendToDrag, dragXOffset, timelineWidth, timelineLeft]);
  return (
    <>
      <AudioElement />
      <TimeLine />
      <PlayButton>{isPlaying ? "Pause" : "Play"}</PlayButton>
      <ElapsedRemaining />
      <DisplayState />
    </>
  );
}
