import "./App.css";
import { PlayButton } from "./Player/PlayButton";
import { Timeline } from "./Timeline/Timeline";
import { MuteButton } from "./Volume/MuteButton";
import { Volume } from "./Volume/Volume";
import { ElapsedRemaining } from "./Player/ElapsedRemaing";
import { Captions } from "./Player/Captions";
import { Seek } from "./Player/Seek";
import { Error } from "./Player/Error";
import { AudioPlayer } from "./Player/AudioPlayer";
import { PlaybackRate } from "./PlaybackRate/PlaybackRate";

function App() {
  return (
    <AudioPlayer
      audioFiles={[{ src: "The-Race.mp3", captionSrc: "captions.vtt" }]}
    >
      <Timeline style={{ height: "40px", backgroundColor: "lightgray" }}>
        <Timeline.Seek>
          <Timeline.Progress style={{ backgroundColor: "darkgray" }} />
        </Timeline.Seek>
        <Timeline.Drag
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
        <MuteButton.LowVolume>Low Volume</MuteButton.LowVolume>
        <MuteButton.HighVolume>High Volume</MuteButton.HighVolume>
        <MuteButton.Muted>Muted</MuteButton.Muted>
      </MuteButton>
      <Seek amount={-10}>Backward</Seek>
      <PlayButton>
        <PlayButton.Playing>Pause</PlayButton.Playing>
        <PlayButton.Paused>Play</PlayButton.Paused>
      </PlayButton>
      <Seek amount={10}>Forward</Seek>
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
      <PlaybackRate.Set playbackRate={0.5} currentIndicator="*">
        0.5x
      </PlaybackRate.Set>
      <PlaybackRate.Set playbackRate={1} currentIndicator="*">
        1x
      </PlaybackRate.Set>
      <PlaybackRate.Set playbackRate={1.5} currentIndicator="*">
        1.5x
      </PlaybackRate.Set>
      <PlaybackRate.Set playbackRate={2} currentIndicator="*">
        2x
      </PlaybackRate.Set>
      <PlaybackRate.Change amount={-0.1}>-0.1x</PlaybackRate.Change>
      <PlaybackRate.Change amount={0.1}>+0.1x</PlaybackRate.Change>
      <Captions />
      <Error>There was an error loading the audio file.</Error>
    </AudioPlayer>
  );
}

export default App;
