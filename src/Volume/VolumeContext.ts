import { createContext } from "react";
import {
  type TimelineContextType,
  initialState as timelineInitialState,
} from "../Timeline/TimelineContext";

export const initialState: TimelineContextType = {
  ...timelineInitialState,
  value: 1,
};

export const VolumeContext = createContext<TimelineContextType>(initialState);
