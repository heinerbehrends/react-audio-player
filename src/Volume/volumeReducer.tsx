import { calculateValue } from "../Shared/sharedFunctions";
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
      if (action.component !== "volume") {
        return state;
      }
      const restrictedClientXY = Math.min(
        Math.max(action.clientXY, state.sliderStart),
        state.sliderStart + state.sliderLength
      );
      const xOffset = restrictedClientXY - state.sliderStart;

      const volume =
        state.orientation === "horizontal"
          ? xOffset / state.sliderLength
          : 1 - xOffset / state.sliderLength;
      const limitedValue = Math.min(Math.max(volume, 0), 1);

      return {
        ...state,
        xyOffset: xOffset,
        value: limitedValue,
      };
    }
    case "DRAG_END": {
      if (state.dragState !== "dragging") return state;
      if (action.component !== "volume") return state;
      const volume = calculateValue({
        xyOffset: action.clientXY,
        sliderLength: state.sliderLength,
        sliderStart: state.sliderStart,
        orientation: state.orientation,
      });
      const limitedValue = Math.min(Math.max(volume, 0), 1);
      return {
        ...state,
        dragState: "idle" as const,
        xyOffset: 0,
        value: limitedValue,
      };
    }
    case "UPDATE_UI_VALUE": {
      const limitedValue = Math.min(Math.max(action.value, 0), 1);
      return { ...state, value: limitedValue };
    }
    case "CANCEL_DRAG": {
      return {
        ...state,
        dragState: "idle" as const,
        xyOffset: 0,
      };
    }
    default: {
      return state;
    }
  }
}
