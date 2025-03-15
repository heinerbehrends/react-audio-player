import { createContext } from "react";
import {
  type TimelineContextType,
  type TimelineContextAction,
  initialState as timelineInitialState,
} from "../Timeline/TimelineContext";

// Reuse the base Timeline types
export type VolumeContextType = TimelineContextType;
export type VolumeContextAction = TimelineContextAction;

export const initialState: VolumeContextType = {
  ...timelineInitialState,
  time: 1,
};

export const VolumeContext = createContext<VolumeContextType>(initialState);
