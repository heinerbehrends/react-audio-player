import { createContext, useContext } from "react";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";

type AudioFileLoadedAction = {
  type: "AUDIO_FILE_LOADED";
};

export type TogglePlayAction = {
  type: "TOGGLE_PLAY";
};

export type ToggleMuteAction = {
  type: "TOGGLE_MUTE";
};

export type UnmuteAction = {
  type: "UNMUTE";
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

type SetVolumeStateAction = {
  type: "SET_VOLUME_STATE";
  volumeState: "muted" | "low" | "high";
};

export type PauseAction = {
  type: "PAUSE";
};

type SetPlaybackRateAction = {
  type: "SET_PLAYBACK_RATE";
  playbackRate: number;
};

type SetDurationAction = {
  type: "SET_DURATION";
  duration: number;
};

export type PlayerContextAction =
  | AudioFileLoadedAction
  | TogglePlayAction
  | ToggleMuteAction
  | UnmuteAction
  | ToggleTimeDisplayAction
  | AudioFileEndedAction
  | AudioFileErrorAction
  | SetVolumeStateAction
  | PauseAction
  | SetPlaybackRateAction
  | SetDurationAction;

export type PlayerContextActionType = PlayerContextAction["type"];

export type VolumeState = "muted" | "low" | "high";

export type PlayerState = "loading" | "playing" | "paused" | "error";
export type PlayerContextType = {
  isMuted: boolean;
  playbackRate: number;
  duration: number;
  handlePlayerAction: (action: PlayerContextAction) => void;
  playerState: PlayerState;
  volumeState: VolumeState;
  timeDisplay: "elapsed" | "remaining";
  audioFiles: { src: string }[];
  customKeyboardShortcuts: KeyToActionMap | undefined;
};

export const initialPlayerState: PlayerContextType = {
  isMuted: false,
  playbackRate: 1,
  duration: 0,
  handlePlayerAction: () => {},
  playerState: "loading",
  volumeState: "high",
  timeDisplay: "elapsed",
  audioFiles: [],
  customKeyboardShortcuts: undefined,
};

export const PlayerContext =
  createContext<PlayerContextType>(initialPlayerState);

export function usePlayerContext(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used within a PlayerContext");
  }
  return context;
}
