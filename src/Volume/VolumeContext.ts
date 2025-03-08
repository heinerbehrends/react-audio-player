import { createContext } from "react";
import {
  TimelineContextType,
  TimelineContextAction,
} from "../Timeline/TimelineContext";

// Reuse the base Timeline types
export type VolumeContextType = TimelineContextType;
export type VolumeContextAction = TimelineContextAction;

export const initialState: VolumeContextType = {
  timelineLeft: 0,
  timelineWidth: 0,
  time: 1, // Start at max volume
  xOffset: 0,
  dragState: "idle",
  dispatch: () => {},
};

export const VolumeContext = createContext<VolumeContextType>(initialState);
