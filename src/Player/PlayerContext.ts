import { createContext } from "react";

type AudioFileLoadedAction = {
  type: "AUDIO_FILE_LOADED";
};

export type TogglePlayAction = {
  type: "TOGGLE_PLAY";
};

export type ToggleMuteAction = {
  type: "TOGGLE_MUTE";
};

type ToggleTimeDisplayAction = {
  type: "TOGGLE_TIME_DISPLAY";
};

export type AudioFileEndedAction = {
  type: "AUDIO_FILE_ENDED";
};

type AudioFileErrorAction = {
  type: "AUDIO_FILE_ERROR";
};

type CaptionCueChangeAction = {
  type: "CAPTION_CUE_CHANGE";
  cues: TextTrackCue[];
};

export type SetVolumeStateAction = {
  type: "SET_VOLUME_STATE";
  volumeState: "muted" | "low" | "high";
};

export type UnmuteAction = {
  type: "UNMUTE";
};

export type PauseAction = {
  type: "PAUSE";
};

export type ToggleCaptionsAction = {
  type: "TOGGLE_CAPTIONS";
};

export type PlayerContextAction =
  | AudioFileLoadedAction
  | TogglePlayAction
  | ToggleMuteAction
  | ToggleTimeDisplayAction
  | AudioFileEndedAction
  | AudioFileErrorAction
  | CaptionCueChangeAction
  | SetVolumeStateAction
  | UnmuteAction
  | PauseAction
  | ToggleCaptionsAction;

export type PlayerContextActionType = PlayerContextAction["type"];

export type VolumeState = "muted" | "low" | "high";

export type PlayerState = "loading" | "playing" | "paused" | "error";
export type PlayerContextType = {
  isMuted: boolean;
  handlePlayerAction: (action: PlayerContextAction) => void;
  playerState: PlayerState;
  showCaptions: boolean;
  volumeState: VolumeState;
  timeDisplay: "elapsed" | "remaining";
  audioFiles: { src: string; captionSrc?: string }[];
  cues: VTTCue[];
};

export const initialPlayerState: PlayerContextType = {
  isMuted: false,
  handlePlayerAction: () => {},
  playerState: "loading",
  showCaptions: true,
  volumeState: "high",
  timeDisplay: "elapsed",
  audioFiles: [],
  cues: [],
};

export const PlayerContext =
  createContext<PlayerContextType>(initialPlayerState);
