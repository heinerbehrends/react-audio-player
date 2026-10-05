import "./App.css";
import { useEffect, useState } from "react";
import {
  AudioPlayer,
  MediaSession,
  PlayButton,
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

/**
 * The current track, and whether it should start on its own: a new `src`
 * arrives paused, so carrying on is the playlist's job. A new object on every
 * choice, so choosing the current track again also starts it.
 */
type Selection = { index: number; play: boolean };

export default function App() {
  const [selection, select] = useState<Selection>({ index: 0, play: false });
  const { index } = selection;

  return (
    <AudioPlayer
      audioFile={{ ...BOOK, ...TRACKS[index] }}
      onEnded={() => {
        if (index < TRACKS.length - 1) select({ index: index + 1, play: true });
      }}
    >
      <Player selection={selection} select={select} />
    </AudioPlayer>
  );
}

type PlayerProps = {
  selection: Selection;
  select: (selection: Selection) => void;
};

function Player({ selection, select }: PlayerProps) {
  const { paused, play } = useAudioPlayer();
  const { index } = selection;
  const hasPrevious = index > 0;
  const hasNext = index < TRACKS.length - 1;
  const previous = () => select({ index: index - 1, play: !paused });
  const next = () => select({ index: index + 1, play: !paused });

  // After the commit, not in the handlers: a `play()` before the new `src`
  // reaches the element is undone when it starts loading it.
  useEffect(() => {
    if (selection.play) play();
  }, [selection, play]);

  return (
    <div className="playlist">
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
        <button
          type="button"
          className="playlist-skip"
          aria-label="Previous track"
          disabled={!hasPrevious}
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
          disabled={!hasNext}
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
              onClick={() => select({ index: i, play: true })}
            >
              <span className="playlist-number">{i + 1}</span>
              {track.title}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
