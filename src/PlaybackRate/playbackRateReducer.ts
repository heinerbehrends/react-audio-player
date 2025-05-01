import { SliderProviderAction } from "../Slider/SliderContext";
import { SliderContext } from "../Slider/SliderContext";
import { getOffset } from "../Shared/sharedFunctions";

export function playbackRateReducer(
  state: SliderContext,
  action: SliderProviderAction
): SliderContext {
  switch (action.type) {
    case "UPDATE_UI_VALUE": {
      if (action.component !== "playbackRate") {
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
        step: state.step,
        component: state.component,
      });
      return {
        ...state,
        dragState: "dragging" as const,
        clientXY: offset,
      };
    }

    case "DRAG": {
      return state;
    }

    case "DRAG_END": {
      if (state.dragState !== "dragging") {
        return state;
      }
      if (action.component !== "playbackRate") {
        return state;
      }
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
