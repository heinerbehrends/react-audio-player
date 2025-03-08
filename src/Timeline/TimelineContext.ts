import { createContext } from "react";

export const TimelineContext = createContext<TimelineContextType>({
  timelineLeft: 0,
  timelineWidth: 0,
  time: 0,
  xOffset: 0,
  dragState: "idle",
  dispatch: () => {},
});

export type TimelineContextType = {
  timelineLeft: number;
  timelineWidth: number;
  time: number;
  xOffset: number;
  dragState: "idle" | "dragging";
  dispatch: (action: TimelineContextAction) => void;
};

export type TimelineLoadedAction = {
  type: "TIMELINE_LOADED";
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
};
export type DragEndAction = {
  type: "DRAG_END";
  clientX: number;
};

export type UpdateTimeAction = {
  type: "UPDATE_TIME";
  time: number;
};

export type SeekAction = {
  type: "SEEK";
  clientX: number;
};

export type SeekToTimeAction = {
  type: "SEEK_TO_TIME";
  time: number;
};

export type TimelineContextAction =
  | TimelineLoadedAction
  | UpdateTimeAction
  | SeekAction
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
  dispatch: () => {},
};
