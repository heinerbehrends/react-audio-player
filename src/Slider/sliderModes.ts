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
 * The three sliders differ on two axes, resolved from one table:
 *
 * - **`writesDuringDrag`** — `"seek"` keeps a local value to display, because
 *   nothing echoes back mid-drag; `"volume"` and `"rate"` write the element and
 *   read their value back from the `volumechange` / `ratechange` projection.
 * - **`unmutesOnGrab`** — the gesture half of the mute coupling: unmute on grab,
 *   and pin the audible-volume memory for the length of the gesture. Volume
 *   only.
 *
 * Mute-at-zero is not here. That rule lives in `handleSideEffect`, because it
 * also has to hold for a consumer's own `CHANGE_VALUE`, which never passes
 * through this table (C2).
 */
export type SliderModeConfig = {
  /** The legacy `component` name the public `SideEffectAction` union carries. */
  component: SliderComponent;
  writesDuringDrag: boolean;
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
   * `bounds` are the slider's own, not the mode's defaults. Under
   * `<PlaybackRateSlider maxValue={2}>` an arrow press that clamped at the
   * library ceiling pushed the element past the end of its own track. Only
   * `"rate"` needs them — see `RATE_BOUNDS`.
   */
  increase: (amount: number, bounds: SliderBounds) => SideEffectAction;
  decrease: (amount: number, bounds: SliderBounds) => SideEffectAction;
};

export type SliderBounds = { minValue: number; maxValue: number };

const percent = (value: number) => `${Math.round(value * 100)}%`;

/**
 * Two decimals is 1 % of the volume range, and the precision `"1.25x"` already
 * shows: enough to hide float noise, fine enough that every arrow step still
 * moves the number (A13).
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
 * the orientation. Each mode adjusts its own value; the global media shortcuts
 * stay available on every other control.
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
