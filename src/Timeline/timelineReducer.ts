import { TimelineContextType, TimelineContextAction } from "./TimelineContext";

export function timelineReducer(
  state: TimelineContextType,
  action: TimelineContextAction
): TimelineContextType {
  switch (action.type) {
    case "UPDATE_UI_VALUE": {
      return { ...state, value: action.value };
    }
    case "SLIDER_LOADED": {
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
        xyOffset: action.clientXY,
      };
    }
    case "DRAG": {
      if (state.dragState !== "dragging") {
        return state;
      }
      return {
        ...state,
        xyOffset: action.clientXY - state.sliderStart,
      };
    }
    case "DRAG_END": {
      return {
        ...state,
        dragState: "idle" as const,
        xyOffset: 0,
        value: action.value,
      };
    }
    default: {
      return state;
    }
  }
}
