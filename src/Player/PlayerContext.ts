import { createContext } from "react";

export type AudioFileLoadedAction = {
  type: "AUDIO_FILE_LOADED";
  element: HTMLAudioElement | null;
};

export type TogglePlayAction = {
  type: "TOGGLE_PLAY";
};

export type PlayerContextAction = AudioFileLoadedAction | TogglePlayAction;

export type PlayerContextType = {
  element: HTMLAudioElement | null;
  dispatch: (action: PlayerContextAction) => void;
  player: "loading" | "playing" | "paused";
};

export const initialState: PlayerContextType = {
  element: null,
  dispatch: () => {},
  player: "loading",
};

export const PlayerContext = createContext<PlayerContextType>(initialState);
