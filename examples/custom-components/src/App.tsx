import "./App.css";
import { useState } from "react";
import {
  AudioPlayer,
  formatTime,
  useAudioPlayer,
  useCurrentTime,
  useIsVolumeAvailable,
  useMuteButtonProps,
  usePlayButtonProps,
  usePlaybackRateSetProps,
  usePlayerRootProps,
  useSeekButtonProps,
  useTimeDisplay,
  useTimeToggleProps,
} from "react-headless-audio-player";
import { AUDIO_BASE } from "./audio";
import { formatPercent, formatRate, german } from "./labels";
import { BINDINGS, shortcuts } from "./shortcuts";
import { Button, Card, Slider } from "./ui";

const EPISODE = {
  src: `${AUDIO_BASE}audio/alice-podcast.mp3`,
  title: "From the Lobster Quadrille to the Trial",
};

const RATES = [1, 1.5, 2];

// `<AudioPlayer>` holds the state and renders only the `<audio>` element.
// Everything on screen is a component of your own, given the player's behaviour
// by a hook. The root also takes the two things that fit the player to an app:
// its words, in `labels.ts`, and its keys, in `shortcuts.ts`.
export default function App() {
  return (
    <AudioPlayer
      audioFile={EPISODE}
      labels={german}
      customKeyboardShortcuts={shortcuts}
    >
      <Player />
    </AudioPlayer>
  );
}

// Its own component because the hooks work only inside the player.
function Player() {
  return (
    // The named region and the keyboard shortcuts, on your own card.
    <Card {...usePlayerRootProps({ className: "custom-components" })}>
      <div className="custom-components-bar">
        <p className="custom-components-title">{EPISODE.title}</p>
        <TimeToggle />
      </div>
      <Scrubber />

      <div className="custom-components-transport">
        <SeekButton amount={-15} />
        <PlayButton />
        <SeekButton amount={30} />
      </div>

      <div className="custom-components-bar">
        <div
          className="custom-components-rates"
          role="group"
          aria-label="Wiedergabegeschwindigkeit"
        >
          {RATES.map((rate) => (
            <RateButton key={rate} rate={rate} />
          ))}
        </div>
        <VolumeControls />
      </div>

      <Shortcuts />
    </Card>
  );
}

function PlayButton() {
  const props = usePlayButtonProps();
  return (
    // The hook's props last, so the disabled gate and handlers stay the
    // library's.
    <Button variant="solid" shape="circle" {...props}>
      {props["data-state"] === "playing" ? <PauseIcon /> : <PlayIcon />}
    </Button>
  );
}

function SeekButton({ amount }: { amount: number }) {
  return (
    <Button shape="circle" {...useSeekButtonProps(amount)}>
      {amount > 0 ? `+${amount}` : amount}
    </Button>
  );
}

// Starts on the time left; a press switches to the time played.
function TimeToggle() {
  const props = useTimeToggleProps("remaining", {
    className: "custom-components-time",
  });
  const { elapsed, remaining } = useTimeDisplay();
  // `remaining` is fractional; rounded as the built-in readout does, so the
  // text matches the name the hook gives the button.
  const seconds = Math.round(remaining);

  return (
    <Button {...props}>
      {props["data-state"] === "elapsed"
        ? formatTime(elapsed)
        : seconds === 0
          ? formatTime(0)
          : `-${formatTime(seconds)}`}
    </Button>
  );
}

function RateButton({ rate }: { rate: number }) {
  // `aria-pressed` marks the rate in effect, which the CSS styles. The text
  // is formatted by the same helper as its name, so both read "1,5×".
  return <Button {...usePlaybackRateSetProps(rate)}>{formatRate(rate)}</Button>;
}

// There are no slider hooks, so the timeline is your own slider
// driven by `useAudioPlayer()` and `useCurrentTime()`.
function Scrubber() {
  const { duration, isSeekable, seek, seekBy } = useAudioPlayer();
  const time = useCurrentTime();
  // While dragging, the thumb follows the pointer rather than waiting for
  // the element to report each seek.
  const [dragged, setDragged] = useState<number | null>(null);

  return (
    <Slider
      className="custom-components-timeline"
      label="Position"
      value={dragged ?? time}
      max={duration}
      step="any"
      disabled={!isSeekable}
      valueText={`${formatTime(time)} von ${formatTime(duration)}`}
      onValueChange={(value) => {
        setDragged(value);
        seek(value);
      }}
      onPointerUp={() => setDragged(null)}
      // Home, End and Page Up/Down reach `onValueChange` too.
      onKeyUp={() => setDragged(null)}
      onBlur={() => setDragged(null)}
      onKeyDown={(event) => {
        // A native range steps by 1 % of an arbitrary length; 5 s, as the
        // library's own timeline does, is predictable.
        const step = {
          ArrowRight: 5,
          ArrowUp: 5,
          ArrowLeft: -5,
          ArrowDown: -5,
        }[event.key];
        if (step === undefined) return;
        event.preventDefault();
        seekBy(step);
      }}
    />
  );
}

function VolumeControls() {
  const { volume, muted, setVolume } = useAudioPlayer();
  const props = useMuteButtonProps();
  // iOS ignores a volume set from script, so there only mute is offered.
  const volumeAvailable = useIsVolumeAvailable();
  const shown = muted ? 0 : volume;

  return (
    <div className="custom-components-volume">
      <Button shape="circle" {...props}>
        {props["data-state"] === "muted" ? <MutedIcon /> : <SpeakerIcon />}
      </Button>
      {volumeAvailable && (
        <Slider
          className="custom-components-volume-slider"
          label="Lautstärke"
          value={shown}
          max={1}
          // The step of the library's volume shortcuts, so a value they set
          // is one the slider can show.
          step={0.025}
          valueText={formatPercent(shown)}
          onValueChange={setVolume}
        />
      )}
    </div>
  );
}

// The player's own keys, beside it, from the list the map is built from.
function Shortcuts() {
  return (
    <div className="custom-components-shortcuts">
      <p className="custom-components-shortcuts-title">Tastenkürzel</p>
      <dl>
        {BINDINGS.map(({ key, label }) => (
          <div key={key}>
            <dt>
              <kbd>{key.toUpperCase()}</kbd>
            </dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
      <p className="custom-components-shortcuts-note">
        Alle anderen Tasten behalten ihre Standardbelegung.
      </p>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 2v12l10-6z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 2h3.5v12H3zM9.5 2H13v12H9.5z" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 6h3l4-3.5v11L5 10H2z" />
      <path
        d="M11 5.5a3.5 3.5 0 0 1 0 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 6h3l4-3.5v11L5 10H2z" />
      <path
        d="M11 6l4 4M15 6l-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
