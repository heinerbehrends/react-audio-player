import type { PlayerState, VolumeState } from "../store/derived";
import type { TimeDisplayState } from "../store/createPlayerStore";
import type { SliderAriaState } from "../Slider/sliderModes";

/**
 * Which of the three readouts a `time` entry is being asked for. `Time.Elapsed`
 * and `Time.Remaining` render into the same slot and exactly one shows, so an
 * entry ignoring this returns the same text for both.
 */
export type TimePart = "elapsed" | "remaining" | "duration";

/**
 * Every string the library speaks, all optional. Pass it to `AudioPlayer` as
 * `labels`; an entry you leave out keeps its English default, and a per-instance
 * `aria-label` still beats both.
 *
 * Two shapes, one rule: **a fixed set of states takes an object of strings, a
 * number in the text takes a function.** The object half survives the React
 * Server Component boundary — a function cannot cross it — so a `de.json` drops
 * straight in and only an app needing the number entries needs `"use client"`.
 *
 * Entries receive **raw** numbers, never preformatted text: `0.8`, not `"80%"`.
 * `Intl` is yours, which is the only way to get "80 %" with a non-breaking space
 * or "1,5x" with a decimal comma.
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
  /** The `<audio>` element's name. Default: "audio player". */
  player?: string;

  /**
   * `PlayButton`'s four names, keyed by its `data-state`. The name is the
   * button's only state channel, so all four are required (A4).
   */
  play?: Record<PlayerState, string>;
  /**
   * `MuteButton`'s name, keyed by its `data-state`. Three states, two names:
   * `low` and `high` both mean audible, so pressing mutes.
   *
   * The state says what _is_, the name says what _pressing does_ — so
   * `muted: "Ton einschalten"` ("unmute") is right, not inverted.
   */
  mute?: Record<VolumeState, string>;
  /**
   * `Time.Toggle`'s name, keyed by its `data-state` — the readout showing, not
   * the one pressing will show. Inverted the same way `mute` is:
   * `elapsed: "Restzeit anzeigen"`.
   */
  timeToggle?: Record<TimeDisplayState, string>;

  /** `SeekButton`'s name. `amount` is signed, in seconds. */
  seek?: (state: { amount: number }) => string;
  /** `PlaybackRate.Set`'s name, for the rate that button sets. */
  rateSet?: (state: { rate: number }) => string;
  /** `PlaybackRate.Change`'s name. `amount` is signed. */
  rateChange?: (state: { amount: number }) => string;
  /** `PlaybackRate`'s group name. Default: "Playback rate options". */
  rateGroup?: string;

  /** The timeline slider's name. Default: "Timeline slider". */
  timelineSlider?: string;
  /** The volume slider's name. Default: "Volume slider". */
  volumeSlider?: string;
  /** The rate slider's name. Default: "Playback rate slider". */
  rateSlider?: string;
  /**
   * The timeline slider's `aria-valuetext`. `value` is the position and
   * `maxValue` the duration, both in seconds; `muted` is unused.
   *
   * Format both ends yourself — overriding `time` does not reach here. One local
   * clock helper called from both is the intended shape.
   */
  timelineValue?: (state: SliderAriaState) => string;
  /**
   * The volume slider's `aria-valuetext`. `value` is 0–1, and `muted` is the
   * element's own flag — a muted player at 0.05 is a reachable state, so write
   * both into the sentence. `maxValue` is unused.
   */
  volumeValue?: (state: SliderAriaState) => string;
  /**
   * The rate slider's `aria-valuetext`. `value` is the rate; `maxValue` and
   * `muted` are unused.
   *
   * All three value entries share one payload so `useSlider` can index them by
   * mode without knowing which slider it is.
   */
  rateValue?: (state: SliderAriaState) => string;

  /**
   * The text in `Time.Elapsed`, `Time.Remaining` and `Time.Duration`.
   *
   * `seconds` is a **magnitude** — finite, never negative, `0` while loading and
   * at the end. The library owns which number; you own how it reads, **sign
   * included**, so a `remaining` part has to write its own `-`. An entry
   * ignoring `part` renders two identical readouts and a `Time.Toggle` that
   * looks dead.
   */
  time?: (state: { seconds: number; part: TimePart }) => string;
  /**
   * `PlaybackRate.Display`'s text. `rate` is already rounded to two decimals, so
   * what is announced and what is shown stay one number.
   */
  rateDisplay?: (state: { rate: number }) => string;
};
