import type {
  TimelineContextType,
  TimelineContextAction,
} from "../Timeline/TimelineContext";

export function volumeReducer(
  state: TimelineContextType,
  action: TimelineContextAction,
  playerElement: HTMLAudioElement | null
): TimelineContextType {
  switch (action.type) {
    case "TIMELINE_LOADED": {
      return {
        ...state,
        timelineLeft: action.timelineLeft,
        timelineWidth: action.timelineWidth,
      };
    }
    case "DRAG_START": {
      if (state.dragState === "dragging") {
        return state;
      }
      return {
        ...state,
        dragState: "dragging" as const,
        xOffset: action.clientX,
      };
    }
    case "DRAG": {
      if (state.dragState !== "dragging" || !playerElement) {
        return state;
      }
      const xOffset = action.clientX - state.timelineLeft;
      if (xOffset < 0) {
        return state;
      }
      if (xOffset > state.timelineWidth) {
        return state;
      }
      const volume = xOffset / state.timelineWidth;
      playerElement.volume = volume;
      return {
        ...state,
        xOffset,
        time: volume,
      };
    }
    case "DRAG_END": {
      if (state.dragState !== "dragging") return state;
      return { ...state, dragState: "idle" as const };
    }
    case "SEEK": {
      if (!playerElement) return state;
      const volume = Math.max(
        0,
        Math.min(1, (action.clientX - state.timelineLeft) / state.timelineWidth)
      );
      playerElement.volume = volume;
      return { ...state, time: volume };
    }
    case "SEEK_TO_TIME": {
      if (!playerElement) return state;
      playerElement.volume = action.time;
      return { ...state, time: action.time };
    }
    default: {
      return state;
    }
  }
}
