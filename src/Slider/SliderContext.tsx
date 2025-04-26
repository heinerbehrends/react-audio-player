import { SideEffectAction } from "../AudioElement/AudioContext";
import { SliderTypes } from "./sliderHooks";

export type SliderLoadedAction = {
  type: "SLIDER_LOADED";
  sliderStart: number;
  sliderLength: number;
};

export type DragStartAction = {
  type: "DRAG_START";
  clientXY: number;
};

export type DragAction = {
  type: "DRAG";
  component: SliderTypes;
  clientXY: number;
  sliderLength: number;
  sliderStart: number;
  orientation?: "horizontal" | "vertical";
  minValue?: number;
  maxValue?: number;
  step?: number;
};

export type DragEndAction = {
  type: "DRAG_END";
  clientXY: number;
  component: SliderTypes;
  sliderLength: number;
  sliderStart: number;
  maxValue: number;
  minValue?: number;
  orientation?: "horizontal" | "vertical";
  step?: number;
};

type CancelDragAction = {
  type: "CANCEL_DRAG";
};

export type UpdateUiValueAction = {
  type: "UPDATE_UI_VALUE";
  value: number;
  component: SliderTypes;
};

export type SliderContextAction =
  | SliderLoadedAction
  | UpdateUiValueAction
  | DragAction
  | DragStartAction
  | DragEndAction
  | CancelDragAction;

export type SliderProviderAction = SideEffectAction | SliderContextAction;

type SideEffectActionType = SideEffectAction["type"];
type SliderActionType = SliderContextAction["type"];

type SliderSideEffectAction = Exclude<SideEffectActionType, "UNMUTE">;
const SLIDER_SIDE_EFFECT_MAP: Record<SliderSideEffectAction, boolean> = {
  DRAG: true,
  DRAG_END: true,
  CHANGE_VALUE: true,
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  AUDIO_FILE_ENDED: true,
  STOP_AUDIO: true,
  SET_PLAYBACK_RATE: true,
};

const SLIDER_DISPATCH_MAP: Record<SliderActionType, true> = {
  SLIDER_LOADED: true,
  DRAG_START: true,
  DRAG: true,
  DRAG_END: true,
  UPDATE_UI_VALUE: true,
  CANCEL_DRAG: true,
};

export function isSliderSideEffect(
  action: SliderProviderAction
): action is SideEffectAction {
  return SLIDER_SIDE_EFFECT_MAP[action.type as SliderSideEffectAction] === true;
}

export function isSliderAction(
  action: SliderProviderAction
): action is SliderContextAction {
  return SLIDER_DISPATCH_MAP[action.type as SliderActionType] === true;
}

export type SliderContext = {
  sliderStart: number;
  sliderLength: number;
  value: number;
  minValue: number;
  maxValue: number;
  xyOffset: number;
  dragState: "idle" | "dragging";
  orientation: "horizontal" | "vertical";
  step: number;
  handleSliderAction: (action: SliderProviderAction) => void;
};

export const initialState: SliderContext = {
  sliderStart: 0,
  sliderLength: 0,
  value: 1,
  minValue: 0,
  maxValue: 1,
  xyOffset: 0,
  dragState: "idle",
  orientation: "horizontal",
  handleSliderAction: () => {},
  step: 0,
};
