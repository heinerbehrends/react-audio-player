import "./App.css";
import { PlayButton } from "./Player/PlayButton";
import { Timeline } from "./Timeline/Timeline";
import { MuteButton } from "./Player/MuteButton";
import { Volume } from "./Volume/Volume";
import { Time } from "./TimeDisplay/Time";
import { Captions } from "./Captions/Captions";
import { Seek } from "./Player/Seek";
import { Error } from "./Player/Error";
import { AudioPlayer } from "./Player/AudioPlayer";
import { PlaybackRate } from "./PlaybackRate/PlaybackRate";
// import { Debug } from "./Debug";
import { useEffect, useState } from "react";

function App() {
  const searchParams = useUrlParams();
  const volumeOrientation =
    (searchParams.get("orientation") as "horizontal" | "vertical") ??
    "horizontal";

  return (
    <AudioPlayer
      audioFiles={[{ src: "The-Race.mp3", captionSrc: "captions.vtt" }]}
    >
      <Timeline style={{ height: "40px", backgroundColor: "lightgray" }}>
        <Timeline.Seek
          style={{ padding: 0, margin: 0, border: "none", background: "none" }}
        >
          <Timeline.Progress style={{ backgroundColor: "darkgray" }} />
        </Timeline.Seek>
        <Timeline.Drag
          style={{
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
      {/* <Time.Toggle> */}
      <Time.Elapsed />
      {/* <Time.Remaining /> */}
      {/* </Time.Toggle> */}
      /
      <Time.Duration />
      <Volume
        orientation={volumeOrientation}
        style={{
          width: volumeOrientation === "horizontal" ? undefined : "40px",
          height: volumeOrientation === "horizontal" ? "40px" : "400px",
          backgroundColor: "gray",
        }}
      >
        <Volume.Set
          style={{
            padding: 0,
            margin: 0,
            border: "none",
            background: "none",
          }}
        >
          <Volume.Progress style={{ backgroundColor: "darkgray" }} />
        </Volume.Set>
        <Volume.Drag
          style={{
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            border: "none",
          }}
        />
        {/* <Debug type="volume" /> */}
      </Volume>
      <PlaybackRate.Display />
      <PlaybackRate.Set rate={0.5}>
        <PlaybackRate.Current rate={0.5}>*</PlaybackRate.Current>
        0.5x
      </PlaybackRate.Set>
      <PlaybackRate.Set rate={1}>
        <PlaybackRate.Current rate={1}>*</PlaybackRate.Current>
        1x
      </PlaybackRate.Set>
      <PlaybackRate.Set rate={1.5}>
        <PlaybackRate.Current rate={1.5}>*</PlaybackRate.Current>
        1.5x
      </PlaybackRate.Set>
      <PlaybackRate.Set rate={2}>
        <PlaybackRate.Current rate={2}>*</PlaybackRate.Current>
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

function useUrlParams() {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    new URLSearchParams(window.location.search)
  );
  useEffect(() => {
    function handleUrlChange() {
      setSearchParams(new URLSearchParams(window.location.search));
    }

    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  return searchParams;
}
