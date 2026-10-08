import { formatTime } from "../Shared/formatTime";
import type {
  SideEffectAction,
  SliderComponent,
} from "../AudioElement/sideEffectActions";

export type SliderMode = "seek" | "volume" | "rate";
/**
 * What a slider's `aria-valuetext` entry receives. The same payload for all
 * three sliders: the timeline reads `value` and `maxValue` as whole seconds,
 * the volume slider reads `value` as `0`–`1` and `muted`, and the rate slider
 * reads `value` alone.
 */
export type SliderAriaState = {
  /** The value being announced, the same number as `aria-valuenow`. */
  value: number;
  /** The top of the range; the duration, for the timeline. */
  maxValue: number;
  /** Whether the element is muted. */
  muted: boolean;
};

/**
 * Everything the three sliders differ on. One config per slider, each its own
 * export, so a root imports only its own: the timeline does not carry the
 * volume and rate strings.
 *
 * Mute-at-zero is deliberately not here: it lives in `handleSideEffect`, which a
 * consumer's own `CHANGE_VALUE` also passes through (C2).
 */
export type SliderModeConfig = {
  mode: SliderMode;
  /**
   * Which slider this is: what a `CHANGE_VALUE` names, internal since S15, and
   * the root's `data-slider`, which is public.
   */
  component: SliderComponent;
  /** The root's export name, for the missing-`.Control` error (S14). */
  rootName: "Timeline" | "Volume" | "PlaybackRateSlider";
  /**
   * `"seek"` keeps a local value to display, since nothing echoes back
   * mid-drag. `"volume"` and `"rate"` write the element and read back from the
   * `volumechange` / `ratechange` projection.
   */
  writesDuringDrag: boolean;
  /** Volume only: unmute on grab, and pin `lastAudibleVolume` for the gesture. */
  unmutesOnGrab: boolean;
  ariaLabel: string;
  /**
   * Which `PlayerLabels` entries override `ariaLabel` and `ariaValueText`.
   * Keys rather than a lookup, so `useSlider` stays one branchless read — it
   * does not know which of the three sliders it is, which is the point of the
   * configs.
   */
  labelKey: "timelineSlider" | "volumeSlider" | "rateSlider";
  valueKey: "timelineValue" | "volumeValue" | "rateValue";
  /**
   * What `aria-valuenow` announces: whole seconds for `"seek"`, so the aria
   * surface cannot churn above 1 Hz, and two decimals for the other two.
   */
  quantizeAriaValue: (value: number) => number;
  ariaValueText: (state: SliderAriaState) => string;
  /**
   * 5 s for `"seek"`: a step under a second moves `currentTime` without moving
   * `currentSecond`, so `aria-valuenow` would not change and the press would be
   * announced as a no-op.
   */
  defaultArrowStep: number;
  /**
   * The arrow-key step. No bounds travel with it: the write path clamps every
   * rate step to the player's `rateRange`, which is also the slider's range,
   * so an arrow press cannot push the thumb past its own track (F15).
   */
  increase: (amount: number) => SideEffectAction;
  decrease: (amount: number) => SideEffectAction;
  /**
   * The range without `minValue` / `maxValue`: `"volume"`'s is `0`–`1`, and
   * `"seek"`'s is the duration. `"rate"`'s root passes the store's.
   */
  defaultBounds?: { minValue: number; maxValue: number };
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

/**
 * Two decimals: enough to hide float noise, fine enough that every arrow step
 * still moves the number (A13).
 */
const hundredths = (value: number) => Math.round(value * 100) / 100;

export const SEEK_MODE = {
  mode: "seek",
  component: "timeline",
  rootName: "Timeline",
  writesDuringDrag: false,
  unmutesOnGrab: false,
  ariaLabel: "Timeline slider",
  labelKey: "timelineSlider",
  valueKey: "timelineValue",
  quantizeAriaValue: Math.floor,
  ariaValueText: ({ value, maxValue }) =>
    `Position ${formatTime(value)} of ${formatTime(maxValue)}`,
  defaultArrowStep: 5,
  increase: (amount) => ({ type: "SET_TIME_FORWARD", value: amount }),
  decrease: (amount) => ({ type: "SET_TIME_BACKWARD", value: amount }),
} satisfies SliderModeConfig;

export const VOLUME_MODE = {
  mode: "volume",
  component: "volume",
  rootName: "Volume",
  writesDuringDrag: true,
  unmutesOnGrab: true,
  ariaLabel: "Volume slider",
  labelKey: "volumeSlider",
  valueKey: "volumeValue",
  quantizeAriaValue: hundredths,
  // `muted` is its own element flag, so the volume alone announced "100%" on
  // a silent player. Adjusting the volume does not unmute, so "Muted, 5%" is
  // a reachable state rather than a contradiction.
  ariaValueText: ({ value, muted }) =>
    muted ? `Muted, ${percent(value)}` : percent(value),
  defaultArrowStep: 0.05,
  // Bounds unused: 0–1 is the browser's own range, so the write clamp is
  // already the number the slider would send.
  increase: (amount) => ({ type: "INCREASE_VOLUME", value: amount }),
  decrease: (amount) => ({ type: "DECREASE_VOLUME", value: amount }),
  defaultBounds: { minValue: 0, maxValue: 1 },
} satisfies SliderModeConfig;

export const RATE_MODE = {
  mode: "rate",
  component: "rate",
  rootName: "PlaybackRateSlider",
  writesDuringDrag: true,
  unmutesOnGrab: false,
  ariaLabel: "Playback rate slider",
  labelKey: "rateSlider",
  valueKey: "rateValue",
  quantizeAriaValue: hundredths,
  // Already rounded: it is handed the quantized value.
  ariaValueText: ({ value }) => `${value}x`,
  defaultArrowStep: 0.1,
  increase: (amount) => ({ type: "INCREASE_PLAYBACK_RATE", value: amount }),
  decrease: (amount) => ({ type: "DECREASE_PLAYBACK_RATE", value: amount }),
} satisfies SliderModeConfig;

/**
 * ARIA's slider keys: Up and Right increase, Down and Left decrease, whatever
 * the orientation.
 */
export const ARROW_KEYS = {
  ArrowUp: "increase",
  ArrowRight: "increase",
  ArrowDown: "decrease",
  ArrowLeft: "decrease",
} as const satisfies Record<string, "increase" | "decrease">;

export type ArrowKey = keyof typeof ARROW_KEYS;

export function isArrowKey(key: string): key is ArrowKey {
  return key in ARROW_KEYS;
}

/**
 * Required by the APG Slider pattern. Deliberately absent from the global media
 * map, unlike the arrows: everywhere but a slider, Home and End belong to the
 * browser.
 */
export const JUMP_KEYS = {
  Home: "minValue",
  End: "maxValue",
} as const satisfies Record<string, "minValue" | "maxValue">;

export type JumpKey = keyof typeof JUMP_KEYS;

export function isJumpKey(key: string): key is JumpKey {
  return key in JUMP_KEYS;
}
