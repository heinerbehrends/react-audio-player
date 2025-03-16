import { createContext } from "react";
import { handleSideEffect } from "./handleSideEffect";
import type {
  AudioFileEndedAction,
  ToggleMuteAction,
  TogglePlayAction,
} from "../Player/PlayerContext";
import type {
  SeekToTimeAction,
  DragEndAction,
  DragAction,
  TimelineContextAction,
} from "../Timeline/TimelineVolumeContext";

export type TimelineProviderRef = {
  handleTimelineAction: ((action: TimelineContextAction) => void) | null;
};

export type StopAudioAction = {
  type: "STOP_AUDIO";
};

export type SideEffectAction =
  | TogglePlayAction
  | ToggleMuteAction
  | SeekToTimeAction
  | DragAction
  | DragEndAction
  | AudioFileEndedAction
  | StopAudioAction;

export type AudioContextType = {
  audioElement: HTMLAudioElement | null;
  setAudioElement: (audioElement: HTMLAudioElement | null) => void;
  handleSideEffect: (
    action: SideEffectAction,
    audioElement: HTMLAudioElement | null
  ) => void;
  // New properties for timeline provider registration
  timelineProviderRef: React.RefObject<TimelineProviderRef> | null;
  setTimelineProviderRef: (
    timelineRef: React.RefObject<TimelineProviderRef>
  ) => void;
};

export const AudioContext = createContext<AudioContextType>({
  audioElement: null,
  setAudioElement: () => {},
  handleSideEffect,
  setTimelineProviderRef: () => {},
  timelineProviderRef: null,
});
