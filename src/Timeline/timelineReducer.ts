import { TimelineContextType } from "./TimelineContext";
import { TimelineContextAction } from "./TimelineContext";

export function timelineReducer(
  state: TimelineContextType,
  action: TimelineContextAction,
  playerElement: HTMLAudioElement | null
) {
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
      if (state.dragState !== "dragging") {
        return state;
      }
      if (action.clientX < state.timelineLeft) {
        return state;
      }
      if (action.clientX > state.timelineLeft + state.timelineWidth) {
        return state;
      }
      return { ...state, xOffset: action.clientX - state.timelineLeft };
    }
    case "DRAG_END": {
      if (state.dragState !== "dragging" || !playerElement) {
        return state;
      }
      const time = calculateTime(
        state.xOffset,
        state.timelineWidth,
        playerElement.duration
      );
      playerElement.currentTime = time;
      return {
        ...state,
        dragState: "idle" as const,
        xOffset: 0,
        time,
      };
    }
    case "UPDATE_TIME": {
      if (!playerElement) {
        return state;
      }
      return { ...state, time: action.time };
    }
    case "SEEK": {
      if (!playerElement) {
        return state;
      }
      const xOffset = action.clientX - state.timelineLeft;
      const time = calculateTime(
        xOffset,
        state.timelineWidth,
        playerElement.duration
      );
      playerElement.currentTime = time;
      return { ...state, time };
    }
    case "SEEK_TO_TIME": {
      if (!playerElement) {
        return state;
      }
      playerElement.currentTime = action.time;
      return { ...state, time: action.time };
    }
    default: {
      return state;
    }
  }
}

function calculateTime(
  xOffset: number,
  timelineWidth: number,
  duration: number
): number {
  const progress = xOffset / timelineWidth;
  return progress * duration;
}
