import type {
  SliderContext,
  SliderContextAction,
} from "../Slider/SliderContext";

export function volumeReducer(
  state: SliderContext,
  action: SliderContextAction
): SliderContext {
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

      return {
        ...state,
        xyOffset: xOffset,
      };
    }

    case "DRAG_END": {
      if (state.dragState !== "dragging") return state;
      if (action.component !== "volume") return state;
      return {
        ...state,
        dragState: "idle" as const,
        xyOffset: 0,
      };
    }

    case "UPDATE_UI_VALUE": {
      if (action.component !== "volume") return state;
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
