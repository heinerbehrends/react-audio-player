import type {
  SliderContextType,
  SliderContextAction,
} from "../Slider/SliderContext";
import { getOffset } from "../Shared/sharedFunctions";

export function volumeReducer(
  state: SliderContextType,
  action: SliderContextAction,
): SliderContextType {
  switch (action.type) {
    case "UPDATE_UI_VALUE": {
      if (action.component !== "volume") {
        return state;
      }
      return {
        ...state,
        value: action.value,
      };
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
      const offset = getOffset({
        ...state,
        clientXY: action.clientXY,
      });
      return {
        ...state,
        dragState: "dragging" as const,
        clientXY: offset,
        offsetFromMiddle: action.offsetFromMiddle,
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
        state.sliderStart + state.sliderLength,
      );
      const clientXY =
        restrictedClientXY - state.sliderStart - state.offsetFromMiddle;
      return {
        ...state,
        clientXY,
      };
    }
    case "DRAG_END": {
      if (state.dragState !== "dragging") return state;
      if (action.component !== "volume") return state;
      return {
        ...state,
        dragState: "idle" as const,
        clientXY: 0,
      };
    }
    case "CANCEL_DRAG": {
      return {
        ...state,
        dragState: "idle" as const,
        clientXY: 0,
      };
    }
    default: {
      return state;
    }
  }
}
