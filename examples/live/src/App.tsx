import "./App.css";
import { useId } from "react";
import {
  AudioPlayer,
  ErrorMessage,
  MediaSession,
  MuteButton,
  PlayButton,
  PlayerRoot,
  Time,
  Volume,
  useAudioPlayer,
  useIsBuffering,
  useIsLive,
} from "react-headless-audio-player";

// Radio Mast's reference stream: free to use, and on air around the clock.
// https://www.radiomast.io/reference-streams
const STATION = {
  src: "https://streams.radiomast.io/ref-128k-mp3-stereo",
  title: "Reference stream",
  artist: "Radio Mast",
  // Firefox reports an MP3 stream as a finite track that grows as it buffers.
  // This says it is live, so nothing offers to seek in it.
  live: true,
};

export default function App() {
  return (
    // `preload: "none"`: a stream never ends, so without it every visit
    // downloads radio until the tab closes, whether anyone listens or not.
    <AudioPlayer audioFile={STATION} audioProps={{ preload: "none" }}>
      <Station />
    </AudioPlayer>
  );
}

// Its own component because the hooks work only inside the player.
function Station() {
  const titleId = useId();
  const buffering = useIsBuffering();

  return (
    <PlayerRoot className="live" aria-labelledby={titleId}>
      {/* The lock screen and media keys. A live stream reports no position,
          so the OS shows no scrubber. */}
      <MediaSession />

      <div className="live-head">
        <PlayButton
          className="live-play"
          data-buffering={buffering || undefined}
        >
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

        <div className="live-station">
          <p className="live-title" id={titleId}>
            {STATION.title}
          </p>
          <p className="live-meta">
            <a href="https://www.radiomast.io/reference-streams">
              {STATION.artist}
            </a>{" "}
            · MP3 128 kbps
          </p>
        </div>

        <OnAir buffering={buffering} />
      </div>

      <div className="live-foot">
        <Status buffering={buffering} />
        <div className="live-volume">
          <MuteButton className="live-mute">
            <MuteButton.HighVolume>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 6h3l4-3.5v11L5 10H2z" />
                <path className="live-wave" d="M11 5.5a3.5 3.5 0 0 1 0 5" />
                <path className="live-wave" d="M12.5 3a7 7 0 0 1 0 10" />
              </svg>
            </MuteButton.HighVolume>
            <MuteButton.LowVolume>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 6h3l4-3.5v11L5 10H2z" />
                <path className="live-wave" d="M11 5.5a3.5 3.5 0 0 1 0 5" />
              </svg>
            </MuteButton.LowVolume>
            <MuteButton.Muted>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 6h3l4-3.5v11L5 10H2z" />
                <path className="live-wave" d="M11 6l4 4M15 6l-4 4" />
              </svg>
            </MuteButton.Muted>
          </MuteButton>
          <Volume className="live-slider">
            <Volume.Control className="live-control">
              <Volume.Background className="live-track" />
              <Volume.Progress className="live-fill" />
            </Volume.Control>
            <Volume.Thumb className="live-thumb" />
          </Volume>
        </div>
      </div>

      <ErrorMessage className="live-error">
        The station is not answering. Try again in a moment.
      </ErrorMessage>
    </PlayerRoot>
  );
}

// `useIsLive()` is the library's word that there is no end to seek towards.
// Green while you hear it: playing, and not stalled.
function OnAir({ buffering }: { buffering: boolean }) {
  const live = useIsLive();
  const { playerState } = useAudioPlayer();
  if (!live) return null;

  return (
    <span
      className="live-badge"
      data-on-air={(playerState === "playing" && !buffering) || undefined}
    >
      Live
    </span>
  );
}

// Only the state is announced: the clock ticks every second, and a live
// region around it would read each one out.
function Status({ buffering }: { buffering: boolean }) {
  const { playerState } = useAudioPlayer();
  const listening = playerState === "playing" && !buffering;
  const state = listening
    ? "Listening"
    : playerState === "playing"
      ? "Buffering…"
      : playerState === "paused"
        ? "Paused"
        : "";

  return (
    <p className="live-status">
      <span aria-live="polite">{state}</span>
      {listening && (
        <>
          {" for "}
          <Time.Elapsed />
        </>
      )}
    </p>
  );
}
