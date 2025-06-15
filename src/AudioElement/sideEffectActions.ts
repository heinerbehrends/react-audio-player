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

type SetUnmuteVolumeAction = {
  type: "SET_UNMUTE_VOLUME";
  unmuteVolume: number;
};

export type PlayAction = {
  type: "PLAY";
};

export type SideEffectAction =
  | PlayAction
  | PauseAction
  | TogglePlayAction
  | ToggleMuteAction
  | StopAudioAction
  | SetPlaybackRateAction
  | ChangeValueAction
  | DragAction
  | DragEndAction
  | AudioFileEndedAction
  | UnmuteAction
  | SetSliderValueAction
  | SetUnmuteVolumeAction;
