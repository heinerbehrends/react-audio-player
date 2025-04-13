import { calculateValue } from "../Shared/sharedFunctions";
import { TimelineContextAction } from "../Timeline/TimelineContext";
import { PlaybackRateContextType } from "./PlaybackRateContext";

export function playbackRateReducer(
  state: PlaybackRateContextType,
  action: TimelineContextAction
): PlaybackRateContextType {
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
      const time = calculateValue({
        xyOffset: action.clientXY,
        sliderLength: state.sliderLength,
        maxValue: action.duration,
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
