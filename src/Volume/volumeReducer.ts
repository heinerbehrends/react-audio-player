import type {
  TimelineContextType,
  TimelineContextAction,
} from "../Timeline/TimelineVolumeContext";

export function volumeReducer(
  state: TimelineContextType,
  action: TimelineContextAction
): TimelineContextType {
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
      const xOffset = action.clientX - state.timelineLeft;
      const volume = xOffset / state.timelineWidth;
      return {
        ...state,
        xOffset,
        time: volume,
      };
    }
    case "DRAG_END": {
      if (state.dragState !== "dragging") return state;
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
    default: {
      return state;
    }
  }
}
