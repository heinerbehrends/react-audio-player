export type SliderComponent = "timeline" | "volume" | "rate";

/**
 * The playback rates the library will write, and the only place they are
 * written down: the widest range that stays audible in both engines. Outside
 * it Firefox keeps playing at the requested speed with the sound cut, below
 * 0.125 and above 8; Chromium is audible up to 16 and throws past it. Measured
 * in Chromium 151 and Firefox 153, 2026-10-05 (C14). Safari is unmeasured.
 *
 * Every write clamps to it — `.Set`, `setRate`, the slider, `.Change` and the
 * `<` `>` keys — so no control can reach a rate another one cannot.
 */
export const RATE_LIMITS = { minValue: 0.125, maxValue: 8 } as const;

/**
 * `<PlaybackRateSlider>`'s default range, narrower than `RATE_LIMITS` so that
 * 1x sits near the middle of the track. A slider sends its own bounds with
 * each step; widen it with `minValue` and `maxValue`, up to `RATE_LIMITS`.
 *
 * The other two sliders need no equivalent: volume's 0–1 is the browser's own
 * range, and the timeline's ceiling is the duration.
 */
export const RATE_BOUNDS = { minValue: 0.5, maxValue: 4 } as const;

export type PlayAction = {
  type: "PLAY";
};

export type PauseAction = {
  type: "PAUSE";
};

export type TogglePlayAction = {
  type: "TOGGLE_PLAY";
};

export type ToggleMuteAction = {
  type: "TOGGLE_MUTE";
};

export type UnmuteAction = {
  type: "UNMUTE";
};

type StopAudioAction = {
  type: "STOP_AUDIO";
};

/** What every slider gesture commits through: one value for one component. */
type ChangeValueAction = {
  type: "CHANGE_VALUE";
  component: SliderComponent;
  value: number;
};

type IncreaseVolumeAction = {
  type: "INCREASE_VOLUME";
  value: number;
};

type DecreaseVolumeAction = {
  type: "DECREASE_VOLUME";
  value: number;
};

type IncreasePlaybackRateAction = {
  type: "INCREASE_PLAYBACK_RATE";
  value: number;
  /** The fastest rate the step may reach. Defaults to the library's maximum, `8`. */
  maxValue?: number;
};

type DecreasePlaybackRateAction = {
  type: "DECREASE_PLAYBACK_RATE";
  value: number;
  /** The slowest rate the step may reach. Defaults to the library's minimum, `0.125`. */
  minValue?: number;
};

export type SetPlaybackRateAction = {
  type: "SET_PLAYBACK_RATE";
  playbackRate: number;
};

type ResetPlaybackRateAction = {
  type: "RESET_PLAYBACK_RATE";
};

type SetTimeForwardAction = {
  type: "SET_TIME_FORWARD";
  value: number;
};

type SetTimeBackwardAction = {
  type: "SET_TIME_BACKWARD";
  value: number;
};

type SetTimeToStartAction = {
  type: "SET_TIME_TO_START";
};

type SetTimeToPercentAction = {
  type: "SET_TIME_TO_PERCENT";
  percent: number;
};

// Listed rather than derived with `Exclude`, so a new internal action cannot
// widen the public surface by default. `CHANGE_VALUE` stays out: it is the
// slider commit, a value in one component's units that means nothing without
// the gesture behind it.
/**
 * An action a keyboard shortcut performs. Bind one to a key through
 * `AudioPlayer`'s `customKeyboardShortcuts`.
 */
export type KeyboardAction =
  | PlayAction
  | PauseAction
  | TogglePlayAction
  | ToggleMuteAction
  | UnmuteAction
  | StopAudioAction
  | SetPlaybackRateAction
  | IncreaseVolumeAction
  | DecreaseVolumeAction
  | IncreasePlaybackRateAction
  | DecreasePlaybackRateAction
  | ResetPlaybackRateAction
  | SetTimeForwardAction
  | SetTimeBackwardAction
  | SetTimeToStartAction
  | SetTimeToPercentAction;

/** Everything `send` accepts: the bindable actions plus the slider commit. */
export type SideEffectAction = KeyboardAction | ChangeValueAction;
