import { createContext } from "react";
import { SideEffectAction } from "../AudioElement/AudioContext";

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

export type SetPlaybackRateAction = {
  type: "SET_PLAYBACK_RATE";
  playbackRate: number;
};

export type SetPlayerVolumeAction = {
  type: "SET_PLAYER_VOLUME";
  volume: number;
};

export type UnmuteAction = {
  type: "UNMUTE";
};

export type PlayerContextAction =
  | AudioFileLoadedAction
  | TogglePlayAction
  | ToggleMuteAction
  | ToggleTimeDisplayAction
  | AudioFileEndedAction
  | AudioFileErrorAction
  | CaptionCueChangeAction
  | SetPlaybackRateAction
  | SetPlayerVolumeAction
  | UnmuteAction;

type SideEffectActionType = SideEffectAction["type"];
type PlayerContextActionType = PlayerContextAction["type"];

export type PlayerProviderAction = SideEffectAction | PlayerContextAction;

export const PLAYER_SIDE_EFFECT_MAP: Record<SideEffectActionType, true> = {
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  SEEK_TO_TIME: true,
  AUDIO_FILE_ENDED: true,
  DRAG: true,
  DRAG_END: true,
  STOP_AUDIO: true,
  SET_PLAYBACK_RATE: true,
  UNMUTE: true,
};

export const PLAYER_DISPATCH_MAP: Record<PlayerContextActionType, true> = {
  AUDIO_FILE_LOADED: true,
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  TOGGLE_TIME_DISPLAY: true,
  AUDIO_FILE_ENDED: true,
  AUDIO_FILE_ERROR: true,
  CAPTION_CUE_CHANGE: true,
  SET_PLAYBACK_RATE: true,
  SET_PLAYER_VOLUME: true,
  UNMUTE: true,
};

export type PlayerContextType = {
  handlePlayerAction: (action: PlayerProviderAction) => void;
  player: "loading" | "playing" | "paused" | "error";
  isMuted: boolean;
  playbackRate: number;
  volume: number;
  timeDisplay: "elapsed" | "remaining";
  audioFiles: { src: string; captionSrc?: string }[];
  cues: VTTCue[];
};

export const initialState: PlayerContextType = {
  handlePlayerAction: () => {},
  player: "loading",
  isMuted: false,
  playbackRate: 1,
  volume: 1,
  timeDisplay: "elapsed",
  audioFiles: [],
  cues: [],
};

export const PlayerContext = createContext<PlayerContextType>(initialState);
