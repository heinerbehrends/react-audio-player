import "./App.css";
import {
  AudioPlayer,
  MediaSession,
  PlayButton,
  PlaybackRate,
  PlayerRoot,
  SeekButton,
  Time,
  Timeline,
  TimelineBuffered,
  useAudioPlayer,
  useCurrentSecond,
} from "react-headless-audio-player";
import { AUDIO_BASE } from "./audio";
// Where each chapter starts, in seconds: written by the script that joins
// the excerpts, so it cannot drift from the audio.
import CHAPTERS from "./chapters.json";

const EPISODE = {
  src: `${AUDIO_BASE}audio/alice-podcast.mp3`,
  title: "From the Lobster Quadrille to the Trial",
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

const RATES = [0.75, 1, 1.25, 1.5, 2];

export default function App() {
  return (
    <AudioPlayer audioFile={EPISODE}>
      <Episode />
    </AudioPlayer>
  );
}

// Its own component because the hooks work only inside the player.
function Episode() {
  return (
    <PlayerRoot className="podcast">
      {/* The lock screen and media keys, with the cover as artwork. */}
      <MediaSession />

      <div className="podcast-head">
        <img
          className="podcast-cover"
          src={EPISODE.artwork[0].src}
          alt=""
          width={72}
          height={72}
        />
        <div>
          <p className="podcast-title">{EPISODE.title}</p>
          <p className="podcast-meta">{EPISODE.album} · Chapters 10–12</p>
        </div>
      </div>

      <div className="podcast-transport">
        <SeekButton className="podcast-seek" amount={-15}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1v4L5 3z" />
            <path
              d="M8 3a5 5 0 1 1-5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
          </svg>
          <span>15</span>
        </SeekButton>
        <PlayButton className="podcast-play">
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
        <SeekButton className="podcast-seek" amount={30}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1v4l3-2z" />
            <path
              d="M8 3a5 5 0 1 0 5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
          </svg>
          <span>30</span>
        </SeekButton>
      </div>

      <div className="podcast-progress">
        <Time.Elapsed className="podcast-time" />
        <Timeline className="podcast-timeline">
          <Timeline.Control className="podcast-control">
            <Timeline.Background className="podcast-track" />
            <TimelineBuffered className="podcast-buffered" />
            <Timeline.Progress className="podcast-fill" />
            <ChapterMarks />
          </Timeline.Control>
          <Timeline.Thumb className="podcast-thumb" />
        </Timeline>
        <Time.Remaining className="podcast-time" />
      </div>

      <PlaybackRate className="podcast-rates">
        {RATES.map((rate) => (
          <PlaybackRate.Set key={rate} className="podcast-rate" rate={rate}>
            {rate}×
          </PlaybackRate.Set>
        ))}
      </PlaybackRate>

      <Chapters />
    </PlayerRoot>
  );
}

// A gap in the track where each chapter after the first begins. Hidden from
// assistive technology: the chapter list below says the same, and can be used.
function ChapterMarks() {
  const { duration } = useAudioPlayer();
  if (!(duration > 0)) return null;

  return CHAPTERS.slice(1).map((chapter) => (
    <span
      key={chapter.title}
      className="podcast-mark"
      style={{ left: `${(chapter.start / duration) * 100}%` }}
      aria-hidden="true"
    />
  ));
}

// Chapters in userland: a sorted list, the current second and `seek()`.
function Chapters() {
  const { seek, play } = useAudioPlayer();
  const second = useCurrentSecond();
  // Floored, because the second is: a seek to 115.75 reads as 115, and would
  // otherwise still mark the chapter before.
  const current = CHAPTERS.reduce(
    (found, chapter, i) => (Math.floor(chapter.start) <= second ? i : found),
    0,
  );

  return (
    <ol className="podcast-chapters" aria-label="Chapters">
      {CHAPTERS.map((chapter, i) => (
        <li key={chapter.title}>
          <button
            type="button"
            aria-current={i === current ? "true" : undefined}
            onClick={() => {
              seek(chapter.start);
              play();
            }}
          >
            <span className="podcast-chapter-time">
              {formatTime(chapter.start)}
            </span>
            {chapter.title}
          </button>
        </li>
      ))}
    </ol>
  );
}

function formatTime(seconds: number) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
