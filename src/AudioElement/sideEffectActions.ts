export type SliderComponent = "timeline" | "volume" | "playbackRate";

/**
 * The library's playback-rate range, and the only place it is written down. A
 * slider with a narrower range sends its own bounds instead; the global `<` and
 * `>` keys have no slider to ask, so they fall back to these.
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

export type AudioFileEndedAction = {
  type: "AUDIO_FILE_ENDED";
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
  /** The sending slider's own ceiling; `RATE_BOUNDS.maxValue` when omitted. */
  maxValue?: number;
};

type DecreasePlaybackRateAction = {
  type: "DECREASE_PLAYBACK_RATE";
  value: number;
  /** The sending slider's own floor; `RATE_BOUNDS.minValue` when omitted. */
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

export type SideEffectAction =
  | PlayAction
  | PauseAction
  | TogglePlayAction
  | ToggleMuteAction
  | StopAudioAction
  | SetPlaybackRateAction
  | ChangeValueAction
  | AudioFileEndedAction
  | UnmuteAction
  | IncreaseVolumeAction
  | DecreaseVolumeAction
  | IncreasePlaybackRateAction
  | DecreasePlaybackRateAction
  | ResetPlaybackRateAction
  | SetTimeForwardAction
  | SetTimeBackwardAction
  | SetTimeToStartAction
  | SetTimeToPercentAction;
