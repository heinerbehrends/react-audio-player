import type { PlayerState, VolumeState } from "../store/derived";
import type { TimeDisplayState } from "../TimeDisplay/TimeDisplay";
import type { SliderAriaState } from "../Slider/sliderModes";

/** Which readout a `labels.time` entry is formatting. */
export type TimePart = "elapsed" | "remaining" | "duration";

/**
 * Every string the library renders or announces, for `AudioPlayer`'s `labels`
 * prop. Each entry is optional and falls back to its English default; a
 * per-instance `aria-label` wins over both. A fixed set of states takes an
 * object of strings. Text with a number in it takes a function, which receives
 * the raw number so `Intl` can format it.
 *
 * @example
 * ```tsx
 * const german: PlayerLabels = {
 *   play: {
 *     playing: "Audio pausieren",
 *     paused: "Audio abspielen",
 *     loading: "Audio wird geladen",
 *     error: "Fehler beim Laden des Audios",
 *   },
 *   seek: ({ amount }) =>
 *     `${Math.abs(amount)} Sekunden ${amount > 0 ? "vorspulen" : "zurückspulen"}`,
 * };
 * ```
 */
export type PlayerLabels = {
  /**
   * `<PlayerRoot>`'s name when `audioFile` has no `title`.
   *
   * @defaultValue "audio player"
   */
  player?: string;

  /**
   * `PlayButton`'s name, one per `data-state`. All four are required: the name
   * is where the state is announced.
   */
  play?: Record<PlayerState, string>;
  /**
   * `MuteButton`'s name, one per `data-state`. The name says what pressing does,
   * so the `muted` entry is the "Unmute" text.
   */
  mute?: Record<VolumeState, string>;
  /**
   * `Time.Toggle`'s name. `time` is the readout as shown and `shown` is the
   * readout showing. Start with `time`, so the name contains the visible text.
   */
  timeToggle?: (state: { time: string; shown: TimeDisplayState }) => string;

  /** `SeekButton`'s name. `amount` is in seconds, negative for a rewind. */
  seek?: (state: { amount: number }) => string;
  /** `PlaybackRate.Set`'s name, for the `rate` it sets. */
  rateSet?: (state: { rate: number }) => string;
  /** `PlaybackRate.Change`'s name. `amount` is negative for a slow-down. */
  rateChange?: (state: { amount: number }) => string;
  /**
   * `PlaybackRate`'s group name.
   *
   * @defaultValue "Playback rate options"
   */
  rateGroup?: string;

  /**
   * The timeline slider's name.
   *
   * @defaultValue "Timeline slider"
   */
  timelineSlider?: string;
  /**
   * The volume slider's name.
   *
   * @defaultValue "Volume slider"
   */
  volumeSlider?: string;
  /**
   * The rate slider's name.
   *
   * @defaultValue "Playback rate slider"
   */
  rateSlider?: string;
  /**
   * The timeline's `aria-valuetext`. `value` is the position and `maxValue` the
   * duration, in whole seconds. `labels.time` does not reach here.
   */
  timelineValue?: (state: SliderAriaState) => string;
  /**
   * The volume slider's `aria-valuetext`. `value` is `0`–`1`; `muted` is the
   * element's flag, which a volume above zero does not rule out.
   */
  volumeValue?: (state: SliderAriaState) => string;
  /** The rate slider's `aria-valuetext`. `value` is the rate, to two decimals. */
  rateValue?: (state: SliderAriaState) => string;

  /**
   * The text of `Time.Elapsed`, `Time.Remaining` and `Time.Duration`.
   * `seconds` is whole and never negative, `0` while loading; `part` says which
   * readout is asking. Write the `-` for `"remaining"` yourself.
   */
  time?: (state: { seconds: number; part: TimePart }) => string;
  /** `PlaybackRate.Display`'s text. `rate` is rounded to two decimals. */
  rateDisplay?: (state: { rate: number }) => string;
};
