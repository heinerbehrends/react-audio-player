import { createContext } from "react";
import { TimelineProviderAction } from "./TimelineProvider";

export const TimelineContext = createContext<TimelineContextType>({
  timelineLeft: 0,
  timelineWidth: 0,
  time: 0,
  xOffset: 0,
  dragState: "idle",
  handleTimelineAction: () => {},
});

export type TimelineContextType = {
  timelineLeft: number;
  timelineWidth: number;
  time: number;
  xOffset: number;
  dragState: "idle" | "dragging";
  handleTimelineAction: (action: TimelineProviderAction) => void;
};

export type TimelineLoadedAction = {
  type: "TIMELINE_LOADED";
  component: "timeline" | "volume";
  timelineLeft: number;
  timelineWidth: number;
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

export type SeekToTimeAction = {
  type: "SEEK_TO_TIME";
  component: "timeline" | "volume";
  time: number;
};

export type TimelineContextAction =
  | TimelineLoadedAction
  | UpdateTimeAction
  | SeekToTimeAction
  | DragAction
  | DragStartAction
  | DragEndAction;

export const initialState: TimelineContextType = {
  timelineLeft: 0,
  timelineWidth: 0,
  time: 0,
  xOffset: 0,
  dragState: "idle",
  handleTimelineAction: () => {},
};
