import { AudioElement } from "./AudioElement";
import { ElapsedRemaining } from "./ElapsedRemaining";
import { PlayButton } from "./PlayButton";
import { TimeLine } from "./TimeLine";
import { LoopButton } from "./LoopButton";
import { AudioPlayerContext } from "./AudioPlayerContext";

const { useSelector } = AudioPlayerContext;

export function AudioPlayer() {
  const isPlaying = useSelector((state) => state.value.track === "playing");
  const isLooping = useSelector((state) => state.context.loop === "on");
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
    </>
  );
}
