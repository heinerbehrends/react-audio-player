import { AudioElement } from "./AudioElement";
import { DisplayState } from "./DisplayState";
import { ElapsedRemaining } from "./ElapsedRemaining";
import { PlayButton } from "./PlayButton";
import { TimeLine } from "./TimeLine";
import { LoopButton } from "./LoopButton";
import { AudioPlayerContext } from "./AudioPlayerContext";

export function AudioPlayer() {
  const isPlaying = AudioPlayerContext.useSelector(
    (state) => state.value.track === "playing"
  );
  const isLooping = AudioPlayerContext.useSelector(
    (state) => state.value.loop === "on"
  );
  return (
    <>
      <AudioElement />
      <TimeLine />
      <PlayButton>{isPlaying ? "Pause" : "Play"}</PlayButton>
      <ElapsedRemaining />
      <LoopButton>
        {isLooping ? (
          <span style={{ textDecoration: "line-through" }}>Loop</span>
        ) : (
          "Loop"
        )}
      </LoopButton>
      <DisplayState />
    </>
  );
}
