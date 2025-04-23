import { SliderProviderAction } from "../Slider/SliderContext";
import { SliderContext } from "../Slider/SliderContext";

export function playbackRateReducer(
  state: SliderContext,
  action: SliderProviderAction
): SliderContext {
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
        xyOffset: 0,
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
