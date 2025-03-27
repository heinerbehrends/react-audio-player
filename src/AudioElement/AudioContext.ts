import { createContext } from "react";
import { handleSideEffect } from "./handleSideEffect";
import type {
  AudioFileEndedAction,
  SetPlaybackRateAction,
  ToggleMuteAction,
  TogglePlayAction,
} from "../Player/PlayerContext";
import type {
  DragEndAction,
  DragAction,
  TimelineContextAction,
} from "../Timeline/TimelineVolumeContext";

export type TimelineProviderRef = {
  handleTimelineAction: ((action: TimelineContextAction) => void) | null;
};

export type VolumeProviderRef = {
  handleVolumeAction: ((action: TimelineContextAction) => void) | null;
};

export type StopAudioAction = {
  type: "STOP_AUDIO";
};

export type SeekToTimeAction = {
  type: "SEEK_TO_TIME";
  component: "timeline" | "volume";
  time: number;
};

export type SideEffectAction =
  | TogglePlayAction
  | ToggleMuteAction
  | SeekToTimeAction
  | DragAction
  | DragEndAction
  | AudioFileEndedAction
  | StopAudioAction
  | SetPlaybackRateAction;

export type AudioContextType = {
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
  handleSideEffect: (
    action: SideEffectAction,
    audioElement: HTMLAudioElement | null
  ) => void;
  timelineCallbackRef: React.RefObject<TimelineProviderRef>;
  volumeCallbackRef: React.RefObject<VolumeProviderRef>;
};

export const AudioContext = createContext<AudioContextType>({
  audioElementRef: { current: null },
  handleSideEffect,
  timelineCallbackRef: { current: { handleTimelineAction: null } },
  volumeCallbackRef: { current: { handleVolumeAction: null } },
});
