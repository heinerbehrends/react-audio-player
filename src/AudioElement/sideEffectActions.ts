import type {
  ToggleMuteAction,
  UnmuteAction,
  SetPlaybackRateAction,
  AudioFileEndedAction,
  PauseAction,
  TogglePlayAction,
} from "../Player/PlayerContext";
import type {
  DragAction,
  DragStartAction,
  DragEndAction,
  SliderData,
} from "../Slider/SliderContext";

export type StopAudioAction = {
  type: "STOP_AUDIO";
};

export type ChangeValueAction = {
  type: "CHANGE_VALUE";
  component: "timeline" | "volume" | "playbackRate";
  value: number;
};

type SetSliderValueAction = SliderData & {
  type: "SET_SLIDER_VALUE";
  component: "timeline" | "volume" | "playbackRate";
};

export type PlayAction = {
  type: "PLAY";
};

export type IncreaseVolumeAction = {
  type: "INCREASE_VOLUME";
  value: number;
};

export type DecreaseVolumeAction = {
  type: "DECREASE_VOLUME";
  value: number;
};

export type IncreasePlaybackRateAction = {
  type: "INCREASE_PLAYBACK_RATE";
  value: number;
};

export type DecreasePlaybackRateAction = {
  type: "DECREASE_PLAYBACK_RATE";
  value: number;
};

export type ResetPlaybackRateAction = {
  type: "RESET_PLAYBACK_RATE";
};

export type SetTimeForwardAction = {
  type: "SET_TIME_FORWARD";
  value: number;
};

export type SetTimeBackwardAction = {
  type: "SET_TIME_BACKWARD";
  value: number;
};

export type SetTimeToStartAction = {
  type: "SET_TIME_TO_START";
};

export type SetTimeToPercentAction = {
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
