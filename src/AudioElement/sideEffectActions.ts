import type {
  ToggleMuteAction,
  UnmuteAction,
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

type PlayAction = {
  type: "PLAY";
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

type SetPlaybackRateAction = {
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
