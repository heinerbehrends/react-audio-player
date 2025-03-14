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

export type SideEffectAction =
  | TogglePlayAction
  | ToggleMuteAction
  | SeekToTimeAction
  | DragAction
  | DragEndAction
  | AudioFileEndedAction;

type AudioContextType = {
  audioElement: HTMLAudioElement | null;
  setAudioElement: (audioElement: HTMLAudioElement | null) => void;
  handleSideEffect: (
    action: SideEffectAction,
    audioElement: HTMLAudioElement | null
  ) => void;
};

export function handleSideEffect(
  action: SideEffectAction,
  audioElement: HTMLAudioElement | null
) {
  if (!audioElement) return;
  switch (action.type) {
    case "TOGGLE_PLAY": {
      if (audioElement.paused) {
        audioElement.play();
      } else {
        audioElement.pause();
      }
      break;
    }
    case "TOGGLE_MUTE": {
      audioElement.muted = !audioElement.muted;
      break;
    }
    case "SEEK_TO_TIME": {
      audioElement.currentTime = action.time;
      break;
    }
    case "AUDIO_FILE_ENDED": {
      audioElement.currentTime = 0;
      break;
    }
    case "DRAG": {
      console.log("DRAG", action.time, action.clientX);
      audioElement.volume = action.time;
      break;
    }
    case "DRAG_END": {
      if (action.component === "timeline") {
        audioElement.currentTime = action.time;
      }
      break;
    }
  }
}

export const AudioContext = createContext<AudioContextType>({
  audioElement: null,
  setAudioElement: () => {},
  handleSideEffect,
});
