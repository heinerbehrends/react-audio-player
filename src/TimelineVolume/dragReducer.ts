import type {
  TimelineContextType,
  TimelineContextAction,
} from "../Timeline/TimelineVolumeContext";

type DragType = "timeline" | "volume";

export function dragReducer(type: DragType) {
  return (state: TimelineContextType, action: TimelineContextAction) => {
    switch (action.type) {
      case "TIMELINE_LOADED": {
        return {
          ...state,
          timelineLeft: action.timelineLeft,
          timelineWidth: action.timelineWidth,
        };
      }
      case "UPDATE_TIME": {
        return { ...state, time: action.time };
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
        if (type === "volume") {
          const xOffset = action.clientX - state.timelineLeft;
          const volume = xOffset / state.timelineWidth;
          return {
            ...state,
            xOffset,
            time: volume,
          };
        }
        if (type === "timeline") {
          return { ...state, xOffset: action.clientX - state.timelineLeft };
        }
        return state;
      }
      case "DRAG_END": {
        if (state.dragState !== "dragging") return state;
        return {
          ...state,
          dragState: "idle" as const,
          xOffset: 0,
          time: action.time,
        };
      }
      default: {
        return state;
      }
    }
  };
}
