import { createContext } from "react";

export type AudioFileLoadedAction = {
  type: "AUDIO_FILE_LOADED";
  element: HTMLAudioElement | null;
};

export type TogglePlayAction = {
  type: "TOGGLE_PLAY";
};

export type ToggleMuteAction = {
  type: "TOGGLE_MUTE";
};

export type AudioFileEndedAction = {
  type: "AUDIO_FILE_ENDED";
};

export type PlayerContextAction =
  | AudioFileLoadedAction
  | TogglePlayAction
  | ToggleMuteAction
  | AudioFileEndedAction;

export type PlayerContextType = {
  element: HTMLAudioElement | null;
  dispatch: (action: PlayerContextAction) => void;
  player: "loading" | "playing" | "paused";
  isMuted: boolean;
  audioFiles: string[];
};

export const initialState: PlayerContextType = {
  element: null,
  dispatch: () => {},
  player: "loading",
  isMuted: false,
  audioFiles: [],
};

export const PlayerContext = createContext<PlayerContextType>(initialState);
