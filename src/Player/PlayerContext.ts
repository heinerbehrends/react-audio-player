import { createContext } from "react";

export type AudioFileLoadedAction = {
  type: "AUDIO_FILE_LOADED";
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

export type AudioFileErrorAction = {
  type: "AUDIO_FILE_ERROR";
  error: Error;
};

export type CaptionCueChangeAction = {
  type: "CAPTION_CUE_CHANGE";
  cues: TextTrackCue[];
};

export type PlayerContextAction =
  | AudioFileLoadedAction
  | TogglePlayAction
  | ToggleMuteAction
  | ToggleTimeDisplayAction
  | AudioFileEndedAction
  | AudioFileErrorAction
  | CaptionCueChangeAction;

export type PlayerContextType = {
  dispatch: (action: PlayerContextAction) => void;
  player: "loading" | "playing" | "paused" | "error";
  isMuted: boolean;
  timeDisplay: "elapsed" | "remaining";
  audioFiles: { src: string; captionSrc?: string }[];
  cues: VTTCue[];
};

export const initialState: PlayerContextType = {
  dispatch: () => {},
  player: "loading",
  isMuted: false,
  timeDisplay: "elapsed",
  audioFiles: [],
  cues: [],
};

export const PlayerContext = createContext<PlayerContextType>(initialState);
