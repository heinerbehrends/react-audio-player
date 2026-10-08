import "react-headless-audio-player/styles.css";
import "./App.css";
import {
  AudioPlayer,
  MuteButton,
  PlayButton,
  PlayerRoot,
  Time,
  Timeline,
  Volume,
} from "react-headless-audio-player";
import { AUDIO_BASE } from "./audio";

export default function App() {
  return (
    <AudioPlayer
      track={{
        src: `${AUDIO_BASE}The-Race.mp3`,
        title: "The Race",
      }}
    >
      {/* A named region that a click focuses, so the shortcuts work from
          anywhere on the bar. */}
      <PlayerRoot className="basic">
        <PlayButton className="basic-play">
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

        <Timeline className="basic-slider basic-timeline">
          <Timeline.Control className="basic-control">
            <Timeline.Background className="basic-track" />
            <Timeline.Progress className="basic-fill" />
          </Timeline.Control>
          <Timeline.Thumb className="basic-thumb" />
        </Timeline>

        <div className="basic-end">
          {/* Shows the time left; press to switch to elapsed. */}
          <Time.Toggle className="basic-time" defaultValue="remaining" />

          {/* The slider opens while the pointer is over this group, or the
              slider has focus, so Tab from mute lands on it. */}
          <div className="basic-volume">
            <MuteButton className="basic-mute">
              <MuteButton.HighVolume>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 6h3l4-3.5v11L5 10H2z" />
                  <path className="basic-wave" d="M11 5.5a3.5 3.5 0 0 1 0 5" />
                  <path className="basic-wave" d="M12.5 3a7 7 0 0 1 0 10" />
                </svg>
              </MuteButton.HighVolume>
              <MuteButton.LowVolume>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 6h3l4-3.5v11L5 10H2z" />
                  <path className="basic-wave" d="M11 5.5a3.5 3.5 0 0 1 0 5" />
                </svg>
              </MuteButton.LowVolume>
              <MuteButton.Muted>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 6h3l4-3.5v11L5 10H2z" />
                  <path className="basic-wave" d="M11 6l4 4M15 6l-4 4" />
                </svg>
              </MuteButton.Muted>
            </MuteButton>

            <Volume className="basic-slider basic-volume-slider">
              <Volume.Control className="basic-control">
                <Volume.Background className="basic-track" />
                <Volume.Progress className="basic-fill" />
              </Volume.Control>
              <Volume.Thumb className="basic-thumb" />
            </Volume>
          </div>
        </div>
      </PlayerRoot>
    </AudioPlayer>
  );
}
