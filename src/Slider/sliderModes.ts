import { formatTime } from "../Shared/formatTime";
import type { SideEffectAction } from "../AudioElement/sideEffectActions";
import type { SliderComponent } from "../AudioElement/sideEffectActions";

export type SliderMode = "seek" | "volume" | "rate";
/**
 * What `aria-valuetext` is composed from: the announced value, plus the element
 * state it has to reflect.
 */
export type SliderAriaState = {
  value: number;
  maxValue: number;
  muted: boolean;
};

/**
 * Everything the three sliders differ on, in one table.
 *
 * Mute-at-zero is deliberately not here: it lives in `handleSideEffect`, which a
 * consumer's own `CHANGE_VALUE` also passes through (C2).
 */
export type SliderModeConfig = {
  /** Which component a `CHANGE_VALUE` names. Internal since S15. */
  component: SliderComponent;
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
   * `bounds` are the slider's own, not the mode's defaults: under
   * `<PlaybackRateSlider maxValue={2}>` an arrow press clamping at the library
   * ceiling pushed the element past the end of its own track. Only `"rate"` uses
   * them (C1).
   */
  increase: (amount: number, bounds: SliderBounds) => SideEffectAction;
  decrease: (amount: number, bounds: SliderBounds) => SideEffectAction;
};

export type SliderBounds = { minValue: number; maxValue: number };

const percent = (value: number) => `${Math.round(value * 100)}%`;

/**
 * Two decimals: enough to hide float noise, fine enough that every arrow step
 * still moves the number (A13).
 */
const hundredths = (value: number) => Math.round(value * 100) / 100;

export const SLIDER_MODES = {
  seek: {
    component: "timeline",
    writesDuringDrag: false,
    unmutesOnGrab: false,
    ariaLabel: "Timeline slider",
    quantizeAriaValue: Math.floor,
    ariaValueText: ({ value, maxValue }) =>
      `Position ${formatTime(value)} of ${formatTime(maxValue)}`,
    defaultArrowStep: 5,
    increase: (amount) => ({ type: "SET_TIME_FORWARD", value: amount }),
    decrease: (amount) => ({ type: "SET_TIME_BACKWARD", value: amount }),
  },
  volume: {
    component: "volume",
    writesDuringDrag: true,
    unmutesOnGrab: true,
    ariaLabel: "Volume slider",
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
  },
  rate: {
    component: "playbackRate",
    writesDuringDrag: true,
    unmutesOnGrab: false,
    ariaLabel: "Playback rate slider",
    quantizeAriaValue: hundredths,
    // Already rounded: it is handed the quantized value.
    ariaValueText: ({ value }) => `${value}x`,
    defaultArrowStep: 0.1,
    increase: (amount, { maxValue }) => ({
      type: "INCREASE_PLAYBACK_RATE",
      value: amount,
      maxValue,
    }),
    decrease: (amount, { minValue }) => ({
      type: "DECREASE_PLAYBACK_RATE",
      value: amount,
      minValue,
    }),
  },
} satisfies Record<SliderMode, SliderModeConfig>;

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
