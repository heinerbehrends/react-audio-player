import "./App.css";
import { useEffect, useState } from "react";
import { PlayButton } from "./Player/PlayButton";
import { Timeline } from "./Timeline/Timeline";
import { MuteButton } from "./Player/MuteButton";
import { Volume } from "./Volume/Volume";
import { Time } from "./TimeDisplay/TimeDisplay";
import { SeekButton } from "./Player/SeekButton";
import { ErrorMessage } from "./Player/ErrorMessage";
import { AudioPlayer } from "./Player/AudioPlayer";
import { PlaybackRate } from "./PlaybackRate/PlaybackRate";
import { PlaybackRateSlider } from "./PlaybackRate/PlaybackRateSlider";
import { Debug } from "./Debug";

const defaultSrc = "The-Race.mp3";

function App() {
  const searchParams = useUrlParams();
  const volumeOrientation =
    (searchParams.get("orientation") as "horizontal" | "vertical") ??
    "horizontal";
  // Lets a spec swap a bad src for a good one within one page session, which is
  // what exercises recovery rather than just the error state.
  const src = searchParams.get("src") ?? defaultSrc;
  // Two independent players on one page, so the per-instance store factory gets
  // exercised.
  const players = Number(searchParams.get("players") ?? 1);

  if (players > 1) {
    return (
      <>
        {Array.from({ length: players }, (_, index) => (
          <section key={index} data-testid={`player-${index}`}>
            <Player src={src} volumeOrientation={volumeOrientation} />
          </section>
        ))}
      </>
    );
  }

  return <Player src={src} volumeOrientation={volumeOrientation} showDebug />;
}

type PlayerProps = {
  src: string;
  volumeOrientation: "horizontal" | "vertical";
  showDebug?: boolean;
};

function Player({ src, volumeOrientation, showDebug }: PlayerProps) {
  return (
    <AudioPlayer audioFile={{ src }}>
      <Timeline style={{ height: "40px" }}>
        <Timeline.Control
          style={{
            border: "none",
            background: "none",
            padding: "12px 0",
            boxSizing: "border-box",
          }}
        >
          <Timeline.Progress style={{ backgroundColor: "darkgray" }} />
          <Timeline.Background style={{ backgroundColor: "lightgray" }} />
        </Timeline.Control>
        <Timeline.Thumb
          data-testid="timeline-drag-thumb"
          style={{
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            border: "solid 1px darkgray",
          }}
        />
        {showDebug ? <Debug /> : null}
      </Timeline>
      <MuteButton>
        <MuteButton.LowVolume>Low Volume</MuteButton.LowVolume>
        <MuteButton.HighVolume>High Volume</MuteButton.HighVolume>
        <MuteButton.Muted>Muted</MuteButton.Muted>
      </MuteButton>
      <SeekButton amount={-10}>Backward</SeekButton>
      <PlayButton>
        <PlayButton.Playing>Pause</PlayButton.Playing>
        <PlayButton.Paused>Play</PlayButton.Paused>
      </PlayButton>
      <SeekButton amount={10}>Forward</SeekButton>
      <Time.Toggle>
        <Time.Elapsed />
        <Time.Remaining />
      </Time.Toggle>
      /
      <Time.Duration />
      <Volume
        orientation={volumeOrientation}
        style={{
          width: volumeOrientation === "horizontal" ? undefined : "40px",
          height: volumeOrientation === "horizontal" ? "40px" : "400px",
        }}
      >
        <Volume.Control
          style={{
            padding: volumeOrientation === "horizontal" ? "12px 0" : "0 12px",
            margin: 0,
            border: "none",
            background: "none",
          }}
        >
          <Volume.Progress style={{ backgroundColor: "darkgray" }} />
          <Volume.Background style={{ backgroundColor: "lightgray" }} />
        </Volume.Control>
        <Volume.Thumb
          data-testid="volume-drag-thumb"
          style={{
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            border: "solid 1px darkgray",
          }}
        />
      </Volume>
      <PlaybackRateSlider
        style={{ height: "40px" }}
        maxValue={2}
        minValue={0.5}
        step={0.1}
      >
        <PlaybackRateSlider.Control
          style={{
            padding: "12px 0",
          }}
        >
          <PlaybackRateSlider.Background
            style={{ backgroundColor: "lightgray" }}
          />
        </PlaybackRateSlider.Control>
        <PlaybackRateSlider.Thumb
          data-testid="rate-drag-thumb"
          style={{
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            border: "solid 1px darkgray",
          }}
        />
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
      <ErrorMessage>There was an error loading the audio file.</ErrorMessage>
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
