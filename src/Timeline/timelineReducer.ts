import { calculateTime } from "../Shared/sharedFunctions";
import { TimelineContextType, TimelineContextAction } from "./TimelineContext";

export function timelineReducer(
  state: TimelineContextType,
  action: TimelineContextAction
): TimelineContextType {
  switch (action.type) {
    case "UPDATE_UI_VALUE": {
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
      if (action.component !== "timeline") {
        return state;
      }
      const time = calculateTime({
        xyOffset: action.clientXY,
        sliderLength: state.sliderLength,
        duration: action.duration,
        sliderStart: state.sliderStart,
      });
      const limitedTime = Math.min(Math.max(time, 0), action.duration);
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
