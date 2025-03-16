import "./App.css";
import { PlayerContextProvider } from "./Player/PlayerProvider";
import { TimelineProvider } from "./Timeline/TimelineProvider";
import { VolumeProvider } from "./Volume/VolumeProvider";
import { AudioElement } from "./Player/AudioElement";
import { PlayButton } from "./Player/PlayButton";
import { Timeline } from "./Timeline/Timeline";
import { MuteButton } from "./Volume/MuteButton";
import { Volume } from "./Volume/Volume";
import { ElapsedRemaining } from "./Player/ElapsedRemaing";
import { AudioContextProvider } from "./AudioElement/AudioContextProvider";
import { Captions } from "./Player/Captions";
import { SeekButton } from "./Player/SeekButton";
import { Error } from "./Player/Error";

function App() {
  return (
    <AudioContextProvider>
      <PlayerContextProvider
        audioFiles={[{ src: "The-Race.mp3", captionSrc: "captions.vtt" }]}
      >
        <AudioElement />
        <TimelineProvider>
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
          </Timeline>
          {/* <Debug type="timeline" /> */}
        </TimelineProvider>
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
        <VolumeProvider>
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
          <MuteButton>
            <MuteButton.LowVolume>Mute</MuteButton.LowVolume>
            <MuteButton.HighVolume>Mute</MuteButton.HighVolume>
            <MuteButton.Muted>Unmute</MuteButton.Muted>
          </MuteButton>
          {/* <Debug type="volume" /> */}
        </VolumeProvider>
        <Captions />
        <Error>There was an error loading the audio file.</Error>
      </PlayerContextProvider>
    </AudioContextProvider>
  );
}

export default App;
