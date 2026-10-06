import "./App.css";
import { useId } from "react";
import {
  AudioPlayer,
  PlayButton,
  PlayerRoot,
  Time,
  Timeline,
} from "react-headless-audio-player";
import { AUDIO_BASE } from "./audio";
// Precomputed by `scripts/generate-peaks.mjs`: one value per bar, 0–1.
import peaks from "./peaks.json";

const TRACK = { src: `${AUDIO_BASE}The-Race.mp3`, title: "The Race" };

// One path for every bar, centred on the middle line. The viewBox is one unit
// per bar, stretched to the timeline's size by `preserveAspectRatio="none"`.
const BARS = peaks
  .map((peak, i) => {
    const height = Math.max(peak * 100, 2);
    return `M${i + 0.2} ${(100 - height) / 2}h0.6v${height}h-0.6z`;
  })
  .join("");

function Bars({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${peaks.length} 100`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={BARS} />
    </svg>
  );
}

export default function App() {
  const titleId = useId();

  return (
    <AudioPlayer audioFile={TRACK}>
      <PlayerRoot className="waveform" aria-labelledby={titleId}>
        <div className="waveform-head">
          <PlayButton className="waveform-play">
            <PlayButton.Paused>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 2v12l10-6z" />
              </svg>
            </PlayButton.Paused>
            <PlayButton.Playing>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 2h4v12H3zM9 2h4v12H9z" />
              </svg>
            </PlayButton.Playing>
          </PlayButton>
          <p className="waveform-title" id={titleId}>
            {TRACK.title}
          </p>
          <p className="waveform-time">
            <Time.Elapsed /> / <Time.Duration />
          </p>
        </div>

        {/* The waveform is the slider's track: a click anywhere on it seeks,
            and the arrow keys, Home, End and the announced position are the
            library's. The played copy reads `--progress` from the root, so
            nothing here re-renders as the track plays. */}
        <Timeline className="waveform-timeline">
          <Timeline.Control className="waveform-control">
            <Bars className="waveform-bars" />
            <Bars className="waveform-bars waveform-played" />
          </Timeline.Control>
          <Timeline.Thumb className="waveform-thumb" />
        </Timeline>
      </PlayerRoot>
    </AudioPlayer>
  );
}
