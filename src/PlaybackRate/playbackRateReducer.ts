import { calculateValue } from "../Shared/sharedFunctions";
import { SliderProviderAction } from "../Slider/SliderContext";
import { SliderContext } from "../Slider/SliderContext";

export function playbackRateReducer(
  state: SliderContext,
  action: SliderProviderAction
): SliderContext {
  console.log("playbackRateReducer", action);
  switch (action.type) {
    case "UPDATE_UI_VALUE": {
      if (action.component !== "playbackRate") return state;
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
      if (action.component !== "playbackRate") {
        return state;
      }
      const restrictedClientXY = Math.min(
        Math.max(action.clientXY, state.sliderStart),
        state.sliderStart + state.sliderLength
      );
      const xOffset = restrictedClientXY - state.sliderStart;
      return {
        ...state,
        xyOffset: xOffset,
      };
    }
    case "DRAG_END": {
      if (state.dragState !== "dragging") {
        return state;
      }
      if (action.component !== "playbackRate") {
        return state;
      }
      const value = calculateValue({
        xyOffset: action.clientXY,
        sliderLength: state.sliderLength,
        maxValue: action.maxValue,
        minValue: action.minValue,
        sliderStart: state.sliderStart,
      });
      const limitedValue = Math.min(Math.max(value, 0), action.maxValue);
      return {
        ...state,
        dragState: "idle" as const,
        xyOffset: 0,
        value: limitedValue,
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
