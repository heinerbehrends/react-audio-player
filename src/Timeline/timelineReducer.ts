import { calculateValue } from "../Shared/sharedFunctions";
import type {
  SliderContext,
  SliderContextAction,
} from "../Slider/SliderContext";

export function timelineReducer(
  state: SliderContext,
  action: SliderContextAction
): SliderContext {
  switch (action.type) {
    case "UPDATE_UI_VALUE": {
      if (action.component !== "timeline") return state;
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
      if (action.component !== "timeline") {
        return state;
      }
      const restrictedClientXY = Math.min(
        Math.max(action.clientXY, state.sliderStart),
        state.sliderStart + state.sliderLength
      );
      const xyOffset = restrictedClientXY - state.sliderStart;
      return {
        ...state,
        xyOffset,
      };
    }

    case "DRAG_END": {
      if (state.dragState !== "dragging") {
        return state;
      }
      if (action.component !== "timeline") {
        return state;
      }
      const time = calculateValue({
        xyOffset: action.clientXY,
        sliderLength: state.sliderLength,
        maxValue: action.maxValue,
        sliderStart: state.sliderStart,
      });
      const limitedTime = Math.min(Math.max(time, 0), action.maxValue ?? 1);
      return {
        ...state,
        dragState: "idle" as const,
        xyOffset: 0,
        value: limitedTime,
      };
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
