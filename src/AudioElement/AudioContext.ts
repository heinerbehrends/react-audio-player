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
} from "../Timeline/TimelineVolumeContext";

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
};

export const AudioContext = createContext<AudioContextType>({
  audioElement: null,
  setAudioElement: () => {},
  handleSideEffect,
});
