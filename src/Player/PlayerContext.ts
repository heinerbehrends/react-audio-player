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

export type ToggleTimeDisplayAction = {
  type: "TOGGLE_TIME_DISPLAY";
};

export type AudioFileEndedAction = {
  type: "AUDIO_FILE_ENDED";
};

export type PlayerContextAction =
  | AudioFileLoadedAction
  | TogglePlayAction
  | ToggleMuteAction
  | ToggleTimeDisplayAction
  | AudioFileEndedAction;

export type PlayerContextType = {
  element: HTMLAudioElement | null;
  dispatch: (action: PlayerContextAction) => void;
  player: "loading" | "playing" | "paused";
  isMuted: boolean;
  timeDisplay: "elapsed" | "remaining";
  audioFiles: string[];
};

export const initialState: PlayerContextType = {
  element: null,
  dispatch: () => {},
  player: "loading",
  isMuted: false,
  timeDisplay: "elapsed",
  audioFiles: [],
};

export const PlayerContext = createContext<PlayerContextType>(initialState);
