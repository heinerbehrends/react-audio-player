import {
  TimelineContextType,
  TimelineContextAction,
} from "./TimelineVolumeContext";

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
        sliderStart: action.sliderStart,
        sliderLength: action.sliderLength,
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
      return { ...state, xOffset: action.clientX - state.sliderStart };
    }
    case "DRAG_END": {
      return {
        ...state,
        dragState: "idle" as const,
        xOffset: 0,
        time: action.time,
      };
    }
    default: {
      return state;
    }
  }
}
