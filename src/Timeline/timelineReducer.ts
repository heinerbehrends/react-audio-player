import { TimelineContextType } from "./TimelineContext";
import { TimelineContextAction } from "./TimelineContext";

export function timelineReducer(
  state: TimelineContextType,
  action: TimelineContextAction
) {
  switch (action.type) {
    case "TIMELINE_LOADED": {
      return {
        ...state,
        timelineLeft: action.timelineLeft,
        timelineWidth: action.timelineWidth,
      };
    }
    case "DRAG_START": {
      if (state.dragState === "dragging") {
        return state;
      }
      return {
        ...state,
        dragState: "dragging" as const,
        xOffset: action.clientX,
      };
    }
    case "DRAG": {
      if (state.dragState !== "dragging") {
        return state;
      }
      if (action.clientX < state.timelineLeft) {
        return state;
      }
      if (action.clientX > state.timelineLeft + state.timelineWidth) {
        return state;
      }
      return { ...state, xOffset: action.clientX - state.timelineLeft };
    }
    case "DRAG_END": {
      return {
        ...state,
        dragState: "idle" as const,
        xOffset: 0,
        time: action.time,
      };
    }
    case "UPDATE_TIME": {
      return { ...state, time: action.time };
    }
    case "SEEK_TO_TIME": {
      return { ...state, time: action.time };
    }
    default: {
      return state;
    }
  }
}
