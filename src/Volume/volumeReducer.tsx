import type {
  SliderContext,
  SliderContextAction,
} from "../Slider/SliderContext";
import { getOffset } from "../Shared/sharedFunctions";

export function volumeReducer(
  state: SliderContext,
  action: SliderContextAction
): SliderContext {
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
        value: state.value,
        sliderLength: state.sliderLength,
        clientXY: action.clientXY,
        minValue: state.minValue,
        maxValue: state.maxValue,
        dragState: state.dragState,
        component: state.component,
      });
      return {
        ...state,
        dragState: "dragging" as const,
        clientXY: offset,
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

      return {
        ...state,
        clientXY: xOffset,
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
