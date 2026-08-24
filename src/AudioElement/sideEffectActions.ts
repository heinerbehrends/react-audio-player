import type {
  DragAction,
  DragStartAction,
  DragEndAction,
  SliderData,
} from "../Slider/SliderContext";

/**
 * The five commands that used to be declared alongside the retired player
 * reducer and imported back into this file. `SideEffectAction` is public API, so the union
 * has to outlive that file — which means its members live where it lives.
 */
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

type ChangeValueAction = {
  type: "CHANGE_VALUE";
  component: "timeline" | "volume" | "playbackRate";
  value: number;
};

type SetSliderValueAction = SliderData & {
  type: "SET_SLIDER_VALUE";
  component: "timeline" | "volume" | "playbackRate";
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
};

type DecreasePlaybackRateAction = {
  type: "DECREASE_PLAYBACK_RATE";
  value: number;
};

/** Declared once, here: the retired player reducer had an identical copy. */
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
  | DragStartAction
  | DragAction
  | DragEndAction
  | AudioFileEndedAction
  | UnmuteAction
  | SetSliderValueAction
  | IncreaseVolumeAction
  | DecreaseVolumeAction
  | IncreasePlaybackRateAction
  | DecreasePlaybackRateAction
  | ResetPlaybackRateAction
  | SetTimeForwardAction
  | SetTimeBackwardAction
  | SetTimeToStartAction
  | SetTimeToPercentAction;
