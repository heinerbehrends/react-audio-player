import { TimelineContextType } from "./TimelineVolumeContext";
import { TimelineContextAction } from "./TimelineVolumeContext";

export function timelineReducer(
  state: TimelineContextType,
  action: TimelineContextAction
) {
  switch (action.type) {
    case "UPDATE_TIME": {
      return { ...state, time: action.time };
    }
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
    case "SEEK_TO_TIME": {
      console.log("SEEK_TO_TIME", action.component);
      if (action.component === "timeline") {
        return { ...state, time: action.time };
      }
      return state;
    }
    default: {
      return state;
    }
  }
}
