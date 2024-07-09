import { useEffect } from "react";
import { useAudioPlayer } from "../logic/useAudioPlayer";
import { AudioElement } from "./AudioElement";
import { DisplayState } from "./DisplayState";
import { ElapsedRemaining } from "./ElapsedRemaining";
import { PlayButton } from "./PlayButton";
import { TimeLine } from "./TimeLine";

export function AudioPlayer() {
  const {
    send,
    isPlaying,
    timelineLeft,
    timelineWidth,
    dragXOffset,
    duration,
  } = useAudioPlayer();

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
    <>
      <AudioElement />
      <TimeLine />
      <PlayButton>{isPlaying ? "Pause" : "Play"}</PlayButton>
      <ElapsedRemaining />
      <DisplayState />
    </>
  );
}
