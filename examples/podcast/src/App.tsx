import "./App.css";
import { Fragment, useEffect, useRef, useState } from "react";
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
  formatTime,
  useAudioControls,
  useAudioPlayer,
  useCurrentSecond,
  useIsAtEnd,
  useIsSeekable,
  useTextTrack,
  type Cue,
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

// The position is remembered per episode, so a return visit starts where the
// last one stopped. `#t=` on the URL is the browser's own way to start a
// track part-way through: it needs no seek, and no waiting for the duration.
const POSITION_KEY = `position:${EPISODE.src}`;

function savedPosition(): number {
  try {
    return Number(localStorage.getItem(POSITION_KEY)) || 0;
  } catch {
    // Storage can be unavailable, as in some private windows.
    return 0;
  }
}

function savePosition(seconds: number) {
  try {
    localStorage.setItem(POSITION_KEY, String(seconds));
  } catch {
    // Nothing to do: the next visit starts from the beginning.
  }
}

export default function App() {
  // Read once: a new `src` is a track change, so the saved position must not
  // reach the URL again while the episode plays.
  const [track] = useState(() => {
    const start = savedPosition();
    return start > 0
      ? { ...EPISODE, src: `${EPISODE.src}#t=${start}` }
      : EPISODE;
  });

  return (
    <AudioPlayer
      track={track}
      audioProps={{
        // The transcript. `crossOrigin` because a sandbox reads it from the
        // deployed demo, another origin; GitHub Pages sends the CORS header.
        crossOrigin: "anonymous",
        children: (
          <track
            kind="subtitles"
            src={`${AUDIO_BASE}audio/alice-podcast.vtt`}
            srcLang="en"
            default
          />
        ),
      }}
    >
      <RememberPosition />
      <Episode />
    </AudioPlayer>
  );
}

// Writes the position once a second as it moves, and 0 at the end so the next
// visit starts over. Only once the duration is known: before that the position
// reads 0 and would wipe what was saved. A write a second is cheap, and no
// unload event fires reliably on a phone.
function RememberPosition() {
  const second = useCurrentSecond();
  const seekable = useIsSeekable();
  const atEnd = useIsAtEnd();

  useEffect(() => {
    if (seekable) savePosition(atEnd ? 0 : second);
  }, [seekable, second, atEnd]);

  return null;
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

      <EndCard />

      <PlaybackRate className="podcast-rates">
        {RATES.map((rate) => (
          <PlaybackRate.Set key={rate} className="podcast-rate" rate={rate}>
            {rate}×
          </PlaybackRate.Set>
        ))}
      </PlaybackRate>

      <Chapters />
      <Transcript />
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

// Always rendered, so the live region exists before its text arrives and the
// end is announced.
function EndCard() {
  const { seek, play } = useAudioControls();
  const atEnd = useIsAtEnd();

  return (
    <div className="podcast-end" role="status">
      {atEnd && (
        <>
          <p>That was chapters 10–12.</p>
          <button
            type="button"
            onClick={() => {
              seek(0);
              play();
            }}
          >
            Listen again
          </button>
        </>
      )}
    </div>
  );
}

// Chapters in userland: a sorted list, the current second and `seek()`.
// Seeks there and plays, for a chapter or a sentence. `seek()` does nothing
// before the duration is known, which under the default `preload` on iOS is
// until the first press. A position chosen then waits here, and the play the
// click starts brings the duration.
function useJumpTo() {
  const { seek, play, isSeekable } = useAudioPlayer();
  const pending = useRef<number | null>(null);
  useEffect(() => {
    if (!isSeekable || pending.current === null) return;
    seek(pending.current);
    pending.current = null;
  }, [isSeekable, seek]);

  return (seconds: number) => {
    if (isSeekable) seek(seconds);
    else pending.current = seconds;
    play();
  };
}

function Chapters() {
  const jumpTo = useJumpTo();
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
            onClick={() => jumpTo(chapter.start)}
          >
            <span className="podcast-chapter-time">
              {/* Floored like `useCurrentSecond()`, so the label agrees with
                  the highlight; `formatTime` alone would round up. */}
              {formatTime(Math.floor(chapter.start))}
            </span>
            {chapter.title}
          </button>
        </li>
      ))}
    </ol>
  );
}

// The transcript, read from the `<track>` child: a paragraph wherever a cue
// has an id, a button per sentence, and the one playing marked.
function Transcript() {
  const { cues, activeIndex, status } = useTextTrack();
  const jumpTo = useJumpTo();
  // Off by default: scrolling under someone reading ahead loses their place.
  const [follow, setFollow] = useState(false);
  const active = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (follow) active.current?.scrollIntoView({ block: "nearest" });
  }, [follow, activeIndex]);

  if (status !== "ready") return null;

  const paragraphs: { cue: Cue; index: number }[][] = [];
  cues.forEach((cue, index) => {
    if (cue.id || paragraphs.length === 0) paragraphs.push([]);
    paragraphs.at(-1)!.push({ cue, index });
  });

  return (
    <section
      className="podcast-transcript"
      aria-labelledby="podcast-transcript"
    >
      <div className="podcast-transcript-head">
        <p id="podcast-transcript" className="podcast-transcript-title">
          Transcript
        </p>
        <label>
          <input
            type="checkbox"
            checked={follow}
            onChange={(event) => setFollow(event.target.checked)}
          />{" "}
          Follow along
        </label>
      </div>
      <div className="podcast-transcript-text">
        {paragraphs.map((sentences) => (
          <p key={sentences[0]!.cue.start}>
            {sentences.map(({ cue, index }) => (
              <Fragment key={cue.start}>
                <button
                  type="button"
                  aria-current={index === activeIndex ? "true" : undefined}
                  ref={index === activeIndex ? active : undefined}
                  onClick={() => jumpTo(cue.start)}
                >
                  {cue.text}
                </button>{" "}
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
