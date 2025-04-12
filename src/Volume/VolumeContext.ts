import { createContext } from "react";
import {
  type TimelineContextType,
  initialState as timelineInitialState,
} from "../Timeline/TimelineContext";

export type VolumeContextType = TimelineContextType & {
  orientation: "horizontal" | "vertical";
};

export const initialState: VolumeContextType = {
  ...timelineInitialState,
  value: 1,
  minValue: 0,
  maxValue: 1,
  orientation: "horizontal",
};

export const VolumeContext = createContext<VolumeContextType>(initialState);
