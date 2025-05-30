import { SideEffectAction } from "../AudioElement/AudioContext";

export type SliderComponent = "timeline" | "volume" | "playbackRate";
export type SliderEvent =
  | React.PointerEvent<HTMLButtonElement>
  | React.TouchEvent<HTMLButtonElement>;

export type SliderLoadedAction = {
  type: "SLIDER_LOADED";
  sliderStart: number;
  sliderLength: number;
};

export type SetMaxValueAction = {
  type: "SET_MAX_VALUE";
  maxValue: number;
};

export type DragStartAction = SliderData & {
  type: "DRAG_START";
  offsetFromMiddle: number;
};

export type DragAction = SliderData & {
  type: "DRAG";
  offsetFromMiddle: number;
  component: SliderComponent;
};

export type DragEndAction = SliderData & {
  type: "DRAG_END";
  offsetFromMiddle: number;
  component: SliderComponent;
};

type CancelDragAction = {
  type: "CANCEL_DRAG";
};

export type UpdateUiValueAction = {
  type: "UPDATE_UI_VALUE";
  value: number;
  component: SliderComponent;
};

export type SliderContextAction =
  | SliderLoadedAction
  | UpdateUiValueAction
  | DragAction
  | DragStartAction
  | DragEndAction
  | CancelDragAction
  | SetMaxValueAction;

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
  SET_SLIDER_VALUE: true,
};

const SLIDER_DISPATCH_MAP: Record<SliderActionType, true> = {
  SLIDER_LOADED: true,
  DRAG_START: true,
  DRAG: true,
  DRAG_END: true,
  UPDATE_UI_VALUE: true,
  CANCEL_DRAG: true,
  SET_MAX_VALUE: true,
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

export type SliderContext = SliderData & {
  value: number;
  dragState: "idle" | "dragging";
  offsetFromMiddle: number;
  handleSliderAction: (action: SliderProviderAction) => void;
};

export const initialState: SliderContext = {
  sliderStart: 0,
  sliderLength: 0,
  value: 1,
  minValue: 0,
  maxValue: 1,
  clientXY: 0,
  dragState: "idle",
  orientation: "horizontal",
  handleSliderAction: () => {},
  step: 0,
  component: "timeline",
  offsetFromMiddle: 0,
};
