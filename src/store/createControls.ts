import { areNumbersClose } from "../Shared/areNumbersClose";
import type { RateRange } from "../AudioElement/rateRange";

/*
 * Media properties throw on an out-of-range write rather than clamping, so each
 * write below is guarded to its own range:
 *
 * - `volume` — [0, 1]; outside throws `IndexSizeError`
 * - `playbackRate` — `0` or [0.0625, 16] in Chromium; a non-zero rate below
 *   1/16, or anything above 16, throws `NotSupportedError`. Firefox clamps
 *   silently (G2). The library writes only the player's `rateRange`, which is
 *   itself clamped to `RATE_LIMITS`, narrower than both, where neither engine
 *   cuts the sound (C14)
 * - `currentTime` — any finite number, clamped to [0, duration] by the browser;
 *   `NaN` throws `TypeError`
 *
 * Sliders clamp by construction, so only consumer input arrives unguarded.
 * Non-finite values are dropped rather than clamped: `NaN` has no meaningful
 * target, and usually means `duration` was read before metadata.
 */

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function writeVolume(audioElement: HTMLAudioElement, value: number) {
  if (!Number.isFinite(value)) return;
  audioElement.volume = clamp(value, 0, 1);
}

/**
 * Every rate write, a step included, lands inside `rateRange`. A rate outside
 * it — written through `audioRef` — is pulled back in by the next write rather
 * than left where it is: with one range per player there is no narrower
 * control a step could wrongly snap back to (F15).
 */
function writeRate(
  audioElement: HTMLAudioElement,
  value: number,
  { minValue, maxValue }: RateRange,
) {
  if (!Number.isFinite(value)) return;
  audioElement.playbackRate = clamp(value, minValue, maxValue);
}

function writeTime(audioElement: HTMLAudioElement, value: number) {
  if (!Number.isFinite(value)) return;
  audioElement.currentTime = value;
}

/**
 * The control methods of `useAudioPlayer()`, and what a shortcut receives.
 * Each keeps its identity for the lifetime of the player, so it is safe in a
 * dependency array.
 */
export type AudioPlayerControls = {
  /** Starts playback. */
  play: () => void;
  /** Pauses playback. */
  pause: () => void;
  /** Plays when paused, pauses when playing. */
  toggle: () => void;
  /** Pauses and returns to the start. */
  stop: () => void;
  /** Seeks to a position in seconds. Does nothing until the duration is known. */
  seek: (seconds: number) => void;
  /** Seeks relative to the position, in seconds. Negative rewinds. */
  seekBy: (seconds: number) => void;
  /** Sets the volume, `0`–`1`. Zero mutes; a value above zero unmutes. */
  setVolume: (volume: number) => void;
  /** Changes the volume by `delta`. Reaching zero mutes; a rise does not unmute. */
  adjustVolume: (delta: number) => void;
  /** Mutes, or unmutes to the last audible volume. */
  setMuted: (muted: boolean) => void;
  /** Mutes, or unmutes to the last audible volume, whichever it is not. */
  toggleMute: () => void;
  /** Sets the playback rate, clamped to `rateRange`; `0` becomes its slowest, so pause instead. */
  setRate: (rate: number) => void;
  /** Changes the playback rate by `delta`, stopping at the ends of `rateRange`. */
  adjustRate: (delta: number) => void;
  /** Reloads the track, playing again if playback was still wanted: after a stall, not after an error. */
  reload: () => void;
};

/** What the controls read from the store, each at call time. */
export type ControlsContext = {
  element: () => HTMLAudioElement | null;
  /** The store's `useIsSeekable()`, so a seek and the timeline always agree. */
  isSeekable: () => boolean;
  lastAudibleVolume: () => number;
  rateRange: () => RateRange;
  /** Re-reads volume and rate off the element, a task ahead of their events. */
  project: () => void;
  playWanted: () => boolean;
  setPlayWanted: (wanted: boolean) => void;
  /** Records the outcome of a `play()`: a refusal, or a start that clears one. */
  settlePlay: (started: Promise<void>) => void;
};

export function createControls(context: ControlsContext): AudioPlayerControls {
  const { element } = context;

  // `play()` resolves once playback starts and rejects when the browser
  // refuses. It returns `undefined` rather than a promise in jsdom and in
  // browsers predating the promise form, hence the normalising.
  const play = () => {
    context.setPlayWanted(true);
    const audioElement = element();
    if (!audioElement) return;
    context.settlePlay(Promise.resolve(audioElement.play()));
  };

  const pause = () => {
    context.setPlayWanted(false);
    element()?.pause();
  };

  // Unmuting a player whose volume is zero has to restore a volume too, or it
  // stays silent. `lastAudibleVolume` covers every path that got it there.
  const unmute = (audioElement: HTMLAudioElement) => {
    if (areNumbersClose(audioElement.volume, 0)) {
      writeVolume(audioElement, context.lastAudibleVolume());
    }
    audioElement.muted = false;
  };

  // Volume and rate read back at once, while their events arrive a task later.
  // Projecting now lands in the same render as the caller's own update, and
  // the echo then changes nothing: one render per drag move, not two.
  const projected =
    <A extends unknown[]>(
      write: (audioElement: HTMLAudioElement, ...args: A) => void,
    ) =>
    (...args: A) => {
      const audioElement = element();
      if (!audioElement) return;
      write(audioElement, ...args);
      context.project();
    };

  const setRate = projected((audioElement, rate: number) =>
    writeRate(audioElement, rate, context.rateRange()),
  );

  return {
    play,
    pause,
    toggle: () => {
      const audioElement = element();
      if (!audioElement) return;
      if (audioElement.paused) play();
      else pause();
    },
    stop: () => {
      context.setPlayWanted(false);
      const audioElement = element();
      if (!audioElement) return;
      if (context.isSeekable()) audioElement.currentTime = 0;
      audioElement.pause();
    },
    seek: (seconds) => {
      const audioElement = element();
      if (!audioElement || !context.isSeekable()) return;
      writeTime(audioElement, seconds);
    },
    // Gated before the sum: `Math.min(currentTime + 5, Infinity)` is finite,
    // so `writeTime` alone would let a live stream seek.
    seekBy: (seconds) => {
      const audioElement = element();
      if (!audioElement || !context.isSeekable()) return;
      const target = audioElement.currentTime + seconds;
      writeTime(
        audioElement,
        seconds >= 0
          ? Math.min(target, audioElement.duration)
          : Math.max(target, 0),
      );
    },
    setVolume: projected((audioElement, volume: number) => {
      const isCloseToZero = areNumbersClose(volume, 0);
      if (audioElement.muted && !isCloseToZero) audioElement.muted = false;
      if (isCloseToZero) audioElement.muted = true;
      writeVolume(audioElement, volume);
    }),
    adjustVolume: projected((audioElement, delta: number) => {
      const volume = Math.max(audioElement.volume + delta, 0);
      if (delta < 0 && areNumbersClose(volume, 0)) {
        audioElement.muted = true;
        return;
      }
      writeVolume(audioElement, volume);
    }),
    setMuted: projected((audioElement, muted: boolean) => {
      if (muted) audioElement.muted = true;
      else unmute(audioElement);
    }),
    toggleMute: projected((audioElement) => {
      if (audioElement.muted) unmute(audioElement);
      else audioElement.muted = true;
    }),
    setRate,
    adjustRate: (delta) => {
      const audioElement = element();
      if (audioElement) setRate(audioElement.playbackRate + delta);
    },
    // `load()` pauses without a `pause` event, so the intent is read first.
    reload: () => {
      const audioElement = element();
      if (!audioElement) return;
      const wanted = context.playWanted();
      audioElement.load();
      if (wanted) play();
    },
  };
}
