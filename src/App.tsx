import "./App.css";
import { PlayButton } from "./Player/PlayButton";
import { Timeline } from "./Timeline/Timeline";
import { MuteButton } from "./Volume/MuteButton";
import { Volume } from "./Volume/Volume";
import { ElapsedRemaining } from "./Player/ElapsedRemaing";
import { Captions } from "./Player/Captions";
import { SeekButton } from "./Player/SeekButton";
import { Error } from "./Player/Error";
import { AudioPlayer } from "./Player/AudioPlayer";
import { SetSpeed } from "./Speed/SetSpeed";
import { IncreaseDecrease } from "./Speed/IncreaseDecrease";

function App() {
  return (
    <AudioPlayer
      audioFiles={[{ src: "The-Race.mp3", captionSrc: "captions.vtt" }]}
    >
      <Timeline style={{ height: "40px", backgroundColor: "lightgray" }}>
        <Timeline.SeekButton>
          <Timeline.Progress style={{ backgroundColor: "darkgray" }} />
        </Timeline.SeekButton>
        <Timeline.DragButton
          style={{
            backgroundColor: "hotpink",
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            border: "none",
          }}
        />
        {/* <Debug type="timeline" /> */}
      </Timeline>
      <MuteButton>
        <MuteButton.LowVolume>Mute</MuteButton.LowVolume>
        <MuteButton.HighVolume>Mute</MuteButton.HighVolume>
        <MuteButton.Muted>Unmute</MuteButton.Muted>
      </MuteButton>
      <SeekButton.Backward>Backward</SeekButton.Backward>
      <PlayButton>
        <PlayButton.Playing>Pause</PlayButton.Playing>
        <PlayButton.Paused>Play</PlayButton.Paused>
      </PlayButton>
      <SeekButton.Forward>Forward</SeekButton.Forward>
      <ElapsedRemaining.Toggle>
        <ElapsedRemaining.Elapsed />
        <ElapsedRemaining.Remaining />
      </ElapsedRemaining.Toggle>
      <Volume style={{ height: "40px", backgroundColor: "lightgray" }}>
        <Volume.SeekButton>
          <Volume.Progress style={{ backgroundColor: "darkgray" }} />
        </Volume.SeekButton>
        <Volume.DragButton
          style={{
            backgroundColor: "yellow",
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            border: "none",
          }}
        />
      </Volume>
      <SetSpeed playbackRate={0.5} currentIndicator="*">
        0.5x
      </SetSpeed>
      <SetSpeed playbackRate={1} currentIndicator="*">
        1x
      </SetSpeed>
      <SetSpeed playbackRate={1.5} currentIndicator="*">
        1.5x
      </SetSpeed>
      <SetSpeed playbackRate={2} currentIndicator="*">
        2x
      </SetSpeed>
      <IncreaseDecrease amount={-0.1}>-0.1x</IncreaseDecrease>
      <IncreaseDecrease amount={0.1}>+0.1x</IncreaseDecrease>
      <Captions />
      <Error>There was an error loading the audio file.</Error>
    </AudioPlayer>
  );
}

export default App;
