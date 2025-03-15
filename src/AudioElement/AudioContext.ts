import { createContext } from "react";
import {
  AudioFileEndedAction,
  ToggleMuteAction,
  TogglePlayAction,
} from "../Player/PlayerContext";
import {
  SeekToTimeAction,
  DragEndAction,
  DragAction,
} from "../Timeline/TimelineContext";
import { handleSideEffect } from "./handleSideEffect";

export type SideEffectAction =
  | TogglePlayAction
  | ToggleMuteAction
  | SeekToTimeAction
  | DragAction
  | DragEndAction
  | AudioFileEndedAction;

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
