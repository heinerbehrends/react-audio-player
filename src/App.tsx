import "./App.css";
import { PlayerContextProvider } from "./Player/PlayerProvider";
import { TimelineProvider } from "./Timeline/TimelineProvider";
import { AudioElement } from "./Player/AudioElement";
import Debug from "./Debug";
import PlayButton from "./Player/PlayButton";
import Timeline from "./Timeline/Timeline";
import { useContext } from "react";
import { PlayerContext } from "./Player/PlayerContext";

function TimelineSection() {
  const { element } = useContext(PlayerContext);

  return (
    <TimelineProvider playerElement={element}>
      <Timeline style={{ height: "40px", backgroundColor: "lightgray" }}>
        <Timeline.SeekButton>
          <Timeline.Background />
          <Timeline.Progress style={{ backgroundColor: "gray" }} />
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
      <Debug />
    </TimelineProvider>
  );
}

function App() {
  return (
    <PlayerContextProvider>
      <AudioElement audioFile="The-Race.mp3" />
      <PlayButton>
        <PlayButton.Playing>Playing</PlayButton.Playing>
        <PlayButton.Paused>Paused</PlayButton.Paused>
      </PlayButton>
      <TimelineSection />
    </PlayerContextProvider>
  );
}

export default App;
