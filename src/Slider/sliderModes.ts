import { formatTime } from "../Shared/sharedFunctions";
import type { SideEffectAction } from "../AudioElement/sideEffectActions";
import type { SliderComponent } from "../AudioElement/sideEffectActions";

export type SliderMode = "seek" | "volume" | "rate";
export type Orientation = "horizontal" | "vertical";

/**
 * The three sliders differ on two axes, resolved from one table:
 *
 * - **`writesDuringDrag`** — `"seek"` keeps a local value to display, because
 *   nothing echoes back mid-drag; `"volume"` and `"rate"` write the element and
 *   read their value back from the `volumechange` / `ratechange` projection.
 * - **`mutesAtZero`** — the mute coupling: unmute on grab, remember the audible
 *   volume, mute on release at zero. Volume only.
 */
export type SliderModeConfig = {
  /** The legacy `component` name the public `SideEffectAction` union carries. */
  component: SliderComponent;
  writesDuringDrag: boolean;
  mutesAtZero: boolean;
  ariaLabel: string;
  /** Whole seconds for `"seek"`, so the aria surface cannot churn above 1 Hz. */
  quantizeAriaValue: (value: number) => number;
  ariaValueText: (value: number, maxValue: number) => string;
  /**
   * 5 s for `"seek"`: a step under a second moves `currentTime` without moving
   * `currentSecond`, so `aria-valuenow` would not change and the press would be
   * announced as a no-op.
   */
  defaultArrowStep: number;
  increase: (amount: number) => SideEffectAction;
  decrease: (amount: number) => SideEffectAction;
};

export const SLIDER_MODES = {
  seek: {
    component: "timeline",
    writesDuringDrag: false,
    mutesAtZero: false,
    ariaLabel: "Timeline slider",
    quantizeAriaValue: Math.floor,
    ariaValueText: (value, maxValue) =>
      `Position ${formatTime(value)} of ${formatTime(maxValue)}`,
    defaultArrowStep: 5,
    increase: (amount) => ({ type: "SET_TIME_FORWARD", value: amount }),
    decrease: (amount) => ({ type: "SET_TIME_BACKWARD", value: amount }),
  },
  volume: {
    component: "volume",
    writesDuringDrag: true,
    mutesAtZero: true,
    ariaLabel: "Volume slider",
    quantizeAriaValue: (value) => value,
    ariaValueText: (value) => `${Math.round(value * 100)}%`,
    defaultArrowStep: 0.05,
    increase: (amount) => ({ type: "INCREASE_VOLUME", value: amount }),
    decrease: (amount) => ({ type: "DECREASE_VOLUME", value: amount }),
  },
  rate: {
    component: "playbackRate",
    writesDuringDrag: true,
    mutesAtZero: false,
    ariaLabel: "Playback rate slider",
    quantizeAriaValue: (value) => value,
    ariaValueText: (value) => `${Math.round(value * 100) / 100}x`,
    defaultArrowStep: 0.1,
    increase: (amount) => ({ type: "INCREASE_PLAYBACK_RATE", value: amount }),
    decrease: (amount) => ({ type: "DECREASE_PLAYBACK_RATE", value: amount }),
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
