import { createContext } from "react";
import {
  type TimelineContextType,
  initialState as timelineInitialState,
} from "../Timeline/TimelineVolumeContext";

export const initialState: TimelineContextType = {
  ...timelineInitialState,
  time: 1,
};

export const VolumeContext = createContext<TimelineContextType>(initialState);
