import "./App.css";
import { useState } from "react";
import {
  AudioPlayer,
  MediaSession,
  PlayButton,
  PlayerRoot,
  Time,
  Timeline,
  useAudioPlayer,
} from "react-headless-audio-player";
import { AUDIO_BASE } from "./audio";

const BOOK = {
  artist: "Lewis Carroll · read by Kara Shallenberg",
  album: "Alice's Adventures in Wonderland",
  artwork: [
    {
      src: `${AUDIO_BASE}audio/alice-cover.jpg`,
      sizes: "300x300",
      type: "image/jpeg",
    },
  ],
};

const TRACKS = [
  { src: `${AUDIO_BASE}audio/alice-01.mp3`, title: "Down the Rabbit-Hole" },
  { src: `${AUDIO_BASE}audio/alice-02.mp3`, title: "The Pool of Tears" },
  {
    src: `${AUDIO_BASE}audio/alice-03.mp3`,
    title: "A Caucus-Race and a Long Tale",
  },
];

// The player carries on across a track change by itself: playing stays playing,
// a track that ran to its end counts as playing, and paused stays paused.
export default function App() {
  const [index, setIndex] = useState(0);

  return (
    <AudioPlayer
      track={{ ...BOOK, ...TRACKS[index] }}
      onEnded={() => {
        if (index < TRACKS.length - 1) setIndex(index + 1);
      }}
    >
      <Player index={index} setIndex={setIndex} />
    </AudioPlayer>
  );
}

type PlayerProps = {
  index: number;
  setIndex: (index: number) => void;
};

// Its own component because `useAudioPlayer()` works only inside the player.
function Player({ index, setIndex }: PlayerProps) {
  const { play } = useAudioPlayer();
  const hasPrevious = index > 0;
  const hasNext = index < TRACKS.length - 1;
  const previous = () => {
    if (hasPrevious) setIndex(index - 1);
  };
  const next = () => {
    if (hasNext) setIndex(index + 1);
  };

  return (
    // Named by the chapter playing. A click anywhere focuses it, and the
    // shortcuts reach previous, next and the track list too, which are this
    // example's own buttons rather than the library's.
    <PlayerRoot className="playlist">
      {/* The lock screen and media keys; previous and next appear only while
          there is a track to go to. */}
      <MediaSession
        onPreviousTrack={hasPrevious ? previous : undefined}
        onNextTrack={hasNext ? next : undefined}
      />

      <div className="playlist-now">
        <img
          className="playlist-cover"
          src={BOOK.artwork[0].src}
          alt=""
          width={72}
          height={72}
        />
        <div>
          <p className="playlist-title">{TRACKS[index].title}</p>
          <p className="playlist-meta">
            {BOOK.album} · Chapter {index + 1}
          </p>
        </div>
      </div>

      <div className="playlist-transport">
        {/* `aria-disabled` rather than `disabled`: a button that turns
            `disabled` while focused drops focus to the body. */}
        <button
          type="button"
          className="playlist-skip"
          aria-label="Previous track"
          aria-disabled={!hasPrevious}
          onClick={previous}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 2h2v12H3zM14 2v12L6 8z" />
          </svg>
        </button>
        <PlayButton className="playlist-play">
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
        <button
          type="button"
          className="playlist-skip"
          aria-label="Next track"
          aria-disabled={!hasNext}
          onClick={next}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M11 2h2v12h-2zM2 2v12l8-6z" />
          </svg>
        </button>
      </div>

      <div className="playlist-progress">
        <Time.Elapsed className="playlist-time" />
        <Timeline className="playlist-timeline">
          <Timeline.Control className="playlist-control">
            <Timeline.Background className="playlist-track" />
            <Timeline.Progress className="playlist-fill" />
          </Timeline.Control>
          <Timeline.Thumb className="playlist-thumb" />
        </Timeline>
        <Time.Duration className="playlist-time" />
      </div>

      <ol className="playlist-tracks">
        {TRACKS.map((track, i) => (
          <li key={track.src}>
            <button
              type="button"
              aria-current={i === index ? "true" : undefined}
              onClick={() => {
                // A click in the list means "play this", even when paused.
                setIndex(i);
                play();
              }}
            >
              <span className="playlist-number">{i + 1}</span>
              {track.title}
            </button>
          </li>
        ))}
      </ol>
    </PlayerRoot>
  );
}
