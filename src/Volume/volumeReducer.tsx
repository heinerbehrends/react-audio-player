import type {
  TimelineContextType,
  TimelineContextAction,
} from "../Timeline/TimelineContext";

export function volumeReducer(
  state: TimelineContextType,
  action: TimelineContextAction
): TimelineContextType {
  switch (action.type) {
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
      const xOffset = action.clientXY - state.sliderStart;

      const volume =
        state.orientation === "horizontal"
          ? xOffset / state.sliderLength
          : 1 - xOffset / state.sliderLength;
      return {
        ...state,
        xyOffset: xOffset,
        value: volume,
      };
    }
    case "DRAG_END": {
      if (state.dragState !== "dragging") return state;
      return {
        ...state,
        dragState: "idle" as const,
        xyOffset: 0,
        value: action.value,
      };
    }
    case "UPDATE_UI_VALUE": {
      return { ...state, value: action.value };
    }
    default: {
      return state;
    }
  }
}
