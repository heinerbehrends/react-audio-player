import { createContext } from "react";
import { handleSideEffect } from "./handleSideEffect";
import type {
  AudioFileEndedAction,
  SetPlaybackRateAction,
  ToggleMuteAction,
  TogglePlayAction,
  UnmuteAction,
} from "../Player/PlayerContext";
import type {
  DragEndAction,
  DragAction,
  TimelineContextAction,
} from "../Timeline/TimelineContext";

export type TimelineProviderRef = {
  handleTimelineAction: ((action: TimelineContextAction) => void) | null;
};

export type VolumeProviderRef = {
  handleVolumeAction: ((action: TimelineContextAction) => void) | null;
};

export type StopAudioAction = {
  type: "STOP_AUDIO";
};

export type ChangeValueAction = {
  type: "CHANGE_VALUE";
  component: "timeline" | "volume";
  value: number;
};

export type SideEffectAction =
  | TogglePlayAction
  | ToggleMuteAction
  | ChangeValueAction
  | DragAction
  | DragEndAction
  | AudioFileEndedAction
  | StopAudioAction
  | SetPlaybackRateAction
  | UnmuteAction;

export type AudioContextType = {
  audioElementRef: React.MutableRefObject<HTMLAudioElement | null>;
  handleSideEffect: (
    action: SideEffectAction,
    audioElement: HTMLAudioElement | null
  ) => void;
  timelineCallbackRef: React.MutableRefObject<TimelineProviderRef>;
  volumeCallbackRef: React.MutableRefObject<VolumeProviderRef>;
};

export const AudioContext = createContext<AudioContextType>({
  audioElementRef: { current: null },
  handleSideEffect,
  timelineCallbackRef: { current: { handleTimelineAction: null } },
  volumeCallbackRef: { current: { handleVolumeAction: null } },
});
