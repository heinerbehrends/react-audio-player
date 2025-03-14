import "./App.css";
import { PlayerContextProvider } from "./Player/PlayerProvider";
import { TimelineProvider } from "./Timeline/TimelineProvider";
import { VolumeProvider } from "./Volume/VolumeProvider";
import { AudioElement } from "./Player/AudioElement";
import PlayButton from "./Player/PlayButton";
import Timeline from "./Timeline/Timeline";
import MuteButton from "./Volume/MuteButton";
import Volume from "./Volume/Volume";
import ElapsedRemaining from "./Player/ElapsedRemaing";
import Debug from "./Debug";

function App() {
  return (
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
        <Debug type="timeline" />
      </TimelineProvider>
      <PlayButton>
        <PlayButton.Playing>Pause</PlayButton.Playing>
        <PlayButton.Paused>Play</PlayButton.Paused>
      </PlayButton>
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
          <MuteButton.NotMuted>Mute</MuteButton.NotMuted>
          <MuteButton.Muted>Unmute</MuteButton.Muted>
        </MuteButton>
        <Debug type="volume" />
      </VolumeProvider>
    </PlayerContextProvider>
  );
}

export default App;
