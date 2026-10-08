import "./App.css";
import { useEffect } from "react";
import {
  AudioPlayer,
  ErrorMessage,
  MediaSession,
  MuteButton,
  PlayButton,
  PlayerRoot,
  Time,
  Volume,
  useAudioControls,
  useAudioPlayer,
  useIsBuffering,
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
    <AudioPlayer track={STATION} audioProps={{ preload: "none" }}>
      <Station />
    </AudioPlayer>
  );
}

// Its own component because the hooks work only inside the player.
function Station() {
  const buffering = useIsBuffering();
  const { reload, play } = useAudioControls();

  // The library reports a dropped stream; reconnecting is the app's call.
  // `reload()` starts the stream afresh, which for a station means live again.
  useReconnectOnStall(buffering, reload);

  return (
    <PlayerRoot className="live">
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
          <p className="live-title">{STATION.title}</p>
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
        The station is not answering.{" "}
        {/* `play()` too: the failure stopped playback, so `reload()` alone
            would leave it stopped. */}
        <button
          className="live-retry"
          onClick={() => {
            reload();
            play();
          }}
        >
          Try again
        </button>
      </ErrorMessage>
    </PlayerRoot>
  );
}

// A connection that answers and then sends nothing raises no error: the
// browser waits on it for good. So a stall this long reconnects. The fresh
// connection reads as loading, not buffering, so a station that is down stops
// here instead of retrying in a loop.
const STALL_LIMIT_MS = 15_000;

function useReconnectOnStall(buffering: boolean, reconnect: () => void) {
  useEffect(() => {
    if (!buffering) return;
    const timer = setTimeout(reconnect, STALL_LIMIT_MS);
    return () => clearTimeout(timer);
  }, [buffering, reconnect]);
}

// Green while you hear it: playing, and not stalled.
function OnAir({ buffering }: { buffering: boolean }) {
  const { playerState } = useAudioPlayer();

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
