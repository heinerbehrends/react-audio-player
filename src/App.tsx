import "./App.css";
import { useEffect, useState } from "react";
import { PlayButton } from "./Player/PlayButton";
import { Timeline } from "./Timeline/Timeline";
import { MuteButton } from "./Player/MuteButton";
import { Volume } from "./Volume/Volume";
import { Time } from "./TimeDisplay/TimeDisplay";
import { Captions } from "./Captions/Captions";
import { Seek } from "./Player/Seek";
import { Error } from "./Player/Error";
import { AudioPlayer } from "./Player/AudioPlayer";
import { PlaybackRate } from "./PlaybackRate/PlaybackRate";
import { PlaybackRateSlider } from "./PlaybackRate/PlaybackRateSlider";
// import { Debug } from "./Debug";
import { Waveform } from "./Waveform/Waveform";
import { useWaveformContext } from "./Waveform/WaveformContext";

function WaveformLineChart({ style, ...props }: React.SVGProps<SVGSVGElement>) {
  const { waveform } = useWaveformContext();
  const width = 800;
  const height = 200;
  const pointWidth = width / (waveform.length - 1);

  // Create a continuous path by connecting points with lines
  const path = waveform
    .map((value, index) => {
      const x = index * pointWidth;
      const y = height - value * height;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", ...style }}
      {...props}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function App() {
  const searchParams = useUrlParams();
  const volumeOrientation =
    (searchParams.get("orientation") as "horizontal" | "vertical") ??
    "horizontal";

  return (
    <AudioPlayer
      audioFiles={[{ src: "The-Race.mp3", captionSrc: "captions.vtt" }]}
    >
      <Waveform>
        <WaveformLineChart />
      </Waveform>
      <Timeline style={{ height: "40px" }}>
        <Timeline.Seek
          style={{
            border: "none",
            background: "none",
            padding: "12px 0",
            boxSizing: "border-box",
          }}
        >
          <Timeline.Progress style={{ backgroundColor: "darkgray" }} />
          <Timeline.Background style={{ backgroundColor: "lightgray" }} />
        </Timeline.Seek>
        <Timeline.Drag
          style={{
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            border: "solid 1px darkgray",
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
        }}
      >
        <Volume.Set
          style={{
            padding: volumeOrientation === "horizontal" ? "12px 0" : "0 12px",
            margin: 0,
            border: "none",
            background: "none",
          }}
        >
          <Volume.Progress style={{ backgroundColor: "darkgray" }} />
          <Volume.Background style={{ backgroundColor: "lightgray" }} />
        </Volume.Set>
        <Volume.Drag
          style={{
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            border: "solid 1px darkgray",
          }}
        />
        {/* <Debug type="volume" /> */}
      </Volume>
      <PlaybackRateSlider
        style={{ height: "40px" }}
        maxValue={2}
        minValue={0.5}
        step={0.1}
      >
        <PlaybackRateSlider.Set
          style={{
            padding: "12px 0",
          }}
        >
          <PlaybackRateSlider.Background
            style={{ backgroundColor: "lightgray" }}
          />
        </PlaybackRateSlider.Set>
        <PlaybackRateSlider.Drag
          style={{
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            border: "solid 1px darkgray",
          }}
        />
        {/* <Debug type="playbackRate" /> */}
      </PlaybackRateSlider>
      <PlaybackRate.Display />
      <PlaybackRate>
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
      </PlaybackRate>
      <PlaybackRate.Change amount={-0.1}>-0.1x</PlaybackRate.Change>
      <PlaybackRate.Change amount={0.1}>+0.1x</PlaybackRate.Change>
      <Captions.Toggle />
      <Captions />
      <Error>There was an error loading the audio file.</Error>
    </AudioPlayer>
  );
}

export default App;

function useUrlParams() {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    new URLSearchParams(window.location.search),
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
