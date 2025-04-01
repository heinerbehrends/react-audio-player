import { TimelineContextType, TimelineContextAction } from "./TimelineContext";

export function timelineReducer(
  state: TimelineContextType,
  action: TimelineContextAction
) {
  switch (action.type) {
    case "UPDATE_UI_VALUE": {
      return { ...state, time: action.value };
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
        xOffset: action.clientXY,
      };
    }
    case "DRAG": {
      if (state.dragState !== "dragging") {
        return state;
      }
      return { ...state, xOffset: action.clientXY - state.sliderStart };
    }
    case "DRAG_END": {
      return {
        ...state,
        dragState: "idle" as const,
        xOffset: 0,
        time: action.value,
      };
    }
    default: {
      return state;
    }
  }
}
