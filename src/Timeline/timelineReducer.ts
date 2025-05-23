import { calculateSliderValue } from "../Shared/sharedFunctions";
import type {
  SliderContext,
  SliderContextAction,
} from "../Slider/SliderContext";
import { getOffset } from "../Shared/sharedFunctions";

export function timelineReducer(
  state: SliderContext,
  action: SliderContextAction
): SliderContext {
  switch (action.type) {
    case "UPDATE_UI_VALUE": {
      if (action.component !== "timeline") {
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

    case "SET_MAX_VALUE": {
      return {
        ...state,
        maxValue: action.maxValue,
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
      if (action.component !== "timeline") {
        return state;
      }
      const restrictedClientXY = Math.min(
        Math.max(action.clientXY, state.sliderStart),
        state.sliderStart + state.sliderLength
      );
      const clientXY = restrictedClientXY - state.sliderStart;
      return {
        ...state,
        clientXY,
      };
    }

    case "DRAG_END": {
      if (state.dragState !== "dragging") {
        return state;
      }
      if (action.component !== "timeline") {
        return state;
      }
      const time = calculateSliderValue({
        clientXY: action.clientXY,
        sliderLength: state.sliderLength,
        maxValue: action.maxValue,
        sliderStart: state.sliderStart,
        minValue: state.minValue,
        orientation: state.orientation,
        step: state.step,
      });
      return {
        ...state,
        dragState: "idle" as const,
        clientXY: 0,
        value: time,
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
