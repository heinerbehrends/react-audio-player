import { AudioElement } from "./AudioElement";
import { ElapsedRemaining } from "./ElapsedRemaining";
import { PlayButton } from "./PlayButton";
import { TimeLine } from "./TimeLine";
import { LoopButton } from "./LoopButton";
import { AudioPlayerContext } from "./AudioPlayerContext";
import { Debug } from "./Debug";
import { SetLoopRegionButton } from "./SetLoopRegionButton";

const { useSelector } = AudioPlayerContext;

export function AudioPlayer() {
  const isPlaying = useSelector((state) => state.value.track === "playing");
  const isLooping = useSelector((state) => state.context.loop === "on");
  return (
    <div style={{ padding: "100px" }}>
      <AudioElement />
      <TimeLine />
      <div style={{ transform: "translateY(20px)" }}>
        <PlayButton>{isPlaying ? "Pause" : "Play"}</PlayButton>
        <ElapsedRemaining />
        <LoopButton>
          {isLooping ? (
            <span style={{ textDecoration: "line-through" }}>Loop</span>
          ) : (
            "Loop"
          )}
        </LoopButton>
        <SetLoopRegionButton />
        <Debug />
      </div>
    </div>
  );
}
