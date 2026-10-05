import "react-headless-audio-player/styles.css";
import "./App.css";
import {
  AudioPlayer,
  PlayButton,
  Time,
  Timeline,
  Volume,
} from "react-headless-audio-player";
import { AUDIO_BASE } from "./audio";

export default function App() {
  return (
    <AudioPlayer
      audioFile={{
        src: `${AUDIO_BASE}The-Race.mp3`,
        title: "The Race",
      }}
    >
      <div className="minimal">
        <PlayButton className="minimal-play">
          <PlayButton.Paused>
            <svg viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 1.5v11l9-5.5z" />
            </svg>
          </PlayButton.Paused>
          <PlayButton.Playing>
            <svg viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" />
            </svg>
          </PlayButton.Playing>
        </PlayButton>

        <Timeline className="minimal-slider minimal-timeline">
          <Timeline.Control className="minimal-control">
            <Timeline.Background className="minimal-track" />
            <Timeline.Progress className="minimal-fill" />
          </Timeline.Control>
          <Timeline.Thumb className="minimal-thumb" />
        </Timeline>

        {/* Press to switch between elapsed and remaining. */}
        <Time.Toggle className="minimal-time">
          <Time.Elapsed />
          <Time.Remaining />
        </Time.Toggle>

        <Volume className="minimal-slider minimal-volume">
          <Volume.Control className="minimal-control">
            <Volume.Background className="minimal-track" />
            <Volume.Progress className="minimal-fill" />
          </Volume.Control>
          <Volume.Thumb className="minimal-thumb" />
        </Volume>
      </div>
    </AudioPlayer>
  );
}
