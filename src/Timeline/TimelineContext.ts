import { createContext } from "react";
import { SideEffectAction } from "../AudioElement/AudioContext";

export const TimelineContext = createContext<TimelineContextType>({
  sliderStart: 0,
  sliderLength: 0,
  value: 0,
  xyOffset: 0,
  dragState: "idle",
  orientation: "horizontal",
  handleTimelineAction: () => {},
});

export type TimelineContextType = {
  sliderStart: number;
  sliderLength: number;
  value: number;
  xyOffset: number;
  dragState: "idle" | "dragging";
  orientation: "horizontal" | "vertical";
  handleTimelineAction: (action: TimelineProviderAction) => void;
};

type SliderComponent = "timeline" | "volume";

export type SliderLoadedAction = {
  type: "SLIDER_LOADED";
  component: SliderComponent;
  sliderStart: number;
  sliderLength: number;
};

export type DragStartAction = {
  type: "DRAG_START";
  clientXY: number;
};

export type DragAction =
  | {
      type: "DRAG";
      component: "volume";
      clientXY: number;
      sliderLength: number;
      sliderStart: number;
      orientation: "horizontal" | "vertical";
    }
  | {
      type: "DRAG";
      component: "timeline";
      clientXY: number;
      duration: number;
      sliderLength: number;
      sliderStart: number;
    };

export type DragEndAction =
  | {
      type: "DRAG_END";
      clientXY: number;
      component: "volume";
      sliderLength: number;
      sliderStart: number;
      orientation: "horizontal" | "vertical";
    }
  | {
      type: "DRAG_END";
      clientXY: number;
      duration: number;
      component: "timeline";
      sliderLength: number;
      sliderStart: number;
      orientation: "horizontal" | "vertical";
    };

type CancelDragAction = {
  type: "CANCEL_DRAG";
};

export type UpdateUiValueAction = {
  type: "UPDATE_UI_VALUE";
  value: number;
};

export type TimelineContextAction =
  | SliderLoadedAction
  | UpdateUiValueAction
  | DragAction
  | DragStartAction
  | DragEndAction
  | CancelDragAction;

export type TimelineProviderAction = SideEffectAction | TimelineContextAction;

type SideEffectActionType = SideEffectAction["type"];
type TimelineActionType = TimelineContextAction["type"];

// Define actions that need side effects
type TimelineSideEffectAction = Exclude<SideEffectActionType, "UNMUTE">;
const TIMELINE_SIDE_EFFECT_MAP: Record<TimelineSideEffectAction, boolean> = {
  DRAG: true,
  DRAG_END: true,
  CHANGE_VALUE: true,
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  AUDIO_FILE_ENDED: true,
  STOP_AUDIO: true,
  SET_PLAYBACK_RATE: true,
};

const TIMELINE_DISPATCH_MAP: Record<TimelineActionType, true> = {
  SLIDER_LOADED: true,
  DRAG_START: true,
  DRAG: true,
  DRAG_END: true,
  UPDATE_UI_VALUE: true,
  CANCEL_DRAG: true,
};

export function isTimelineSideEffect(
  action: TimelineProviderAction
): action is SideEffectAction {
  return (
    TIMELINE_SIDE_EFFECT_MAP[action.type as TimelineSideEffectAction] === true
  );
}

export function isTimelineAction(
  action: TimelineProviderAction
): action is TimelineContextAction {
  return TIMELINE_DISPATCH_MAP[action.type as TimelineActionType] === true;
}

export const initialState: TimelineContextType = {
  sliderStart: 0,
  sliderLength: 0,
  value: 0,
  xyOffset: 0,
  dragState: "idle",
  orientation: "horizontal",
  handleTimelineAction: () => {},
};
