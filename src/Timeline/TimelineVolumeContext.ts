import { createContext } from "react";
import { SideEffectAction } from "../AudioElement/AudioContext";

export const TimelineContext = createContext<TimelineContextType>({
  sliderStart: 0,
  sliderLength: 0,
  time: 0,
  xOffset: 0,
  dragState: "idle",
  handleTimelineAction: () => {},
});

export type TimelineContextType = {
  sliderStart: number;
  sliderLength: number;
  time: number;
  xOffset: number;
  dragState: "idle" | "dragging";
  handleTimelineAction: (action: TimelineProviderAction) => void;
};

export type TimelineLoadedAction = {
  type: "TIMELINE_LOADED";
  component: "timeline" | "volume";
  sliderStart: number;
  sliderLength: number;
};

export type DragStartAction = {
  type: "DRAG_START";
  clientX: number;
};
export type DragAction = {
  type: "DRAG";
  clientX: number;
  component: "timeline" | "volume";
  time: number;
};
export type DragEndAction = {
  type: "DRAG_END";
  time: number;
  component: "timeline" | "volume";
};

export type UpdateTimeAction = {
  type: "UPDATE_TIME";
  time: number;
};

export type TimelineContextAction =
  | TimelineLoadedAction
  | UpdateTimeAction
  // | SeekToTimeAction
  | DragAction
  | DragStartAction
  | DragEndAction;

export type TimelineProviderAction = SideEffectAction | TimelineContextAction;

// Extract action types for better type safety
type SideEffectActionType = SideEffectAction["type"];
type TimelineActionType = TimelineContextAction["type"];

// Define actions that need side effects
const TIMELINE_SIDE_EFFECT_MAP: Record<SideEffectActionType, true> = {
  DRAG: true,
  DRAG_END: true,
  SEEK_TO_TIME: true,
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  AUDIO_FILE_ENDED: true,
  STOP_AUDIO: true,
  SET_PLAYBACK_RATE: true,
};

const TIMELINE_DISPATCH_MAP: Record<TimelineActionType, true> = {
  TIMELINE_LOADED: true,
  DRAG_START: true,
  DRAG: true,
  DRAG_END: true,
  UPDATE_TIME: true,
};

export function isTimelineSideEffect(
  action: TimelineProviderAction
): action is SideEffectAction {
  return TIMELINE_SIDE_EFFECT_MAP[action.type as SideEffectActionType] === true;
}

export function isTimelineAction(
  action: TimelineProviderAction
): action is TimelineContextAction {
  return TIMELINE_DISPATCH_MAP[action.type as TimelineActionType] === true;
}

export const initialState: TimelineContextType = {
  sliderStart: 0,
  sliderLength: 0,
  time: 0,
  xOffset: 0,
  dragState: "idle",
  handleTimelineAction: () => {},
};
