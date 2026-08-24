export type SliderComponent = "timeline" | "volume" | "playbackRate";

/**
 * The geometry a slider gesture used to travel with, back when the reducers
 * owned the geometry and the element write happened elsewhere. `useSlider` owns
 * both now and commits through `CHANGE_VALUE`, so nothing in `src/` dispatches
 * these — they stay because they are part of the published `SideEffectAction`
 * union.
 */
export type SliderData = {
  clientXY: number;
  sliderStart: number;
  sliderLength: number;
  minValue: number;
  maxValue: number;
  orientation: "horizontal" | "vertical";
  step: number;
  component: SliderComponent;
};

export type DragStartAction = SliderData & {
  type: "DRAG_START";
  offsetFromMiddle: number;
};

export type DragAction = SliderData & {
  type: "DRAG";
  offsetFromMiddle: number;
};

export type DragEndAction = SliderData & {
  type: "DRAG_END";
  offsetFromMiddle: number;
};

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

/** What every slider gesture commits through: one value, one component. */
type ChangeValueAction = {
  type: "CHANGE_VALUE";
  component: SliderComponent;
  value: number;
};

type SetSliderValueAction = SliderData & {
  type: "SET_SLIDER_VALUE";
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
