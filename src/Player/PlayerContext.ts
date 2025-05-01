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
  unmuteVolume: number;
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

export type SetUnmuteVolumeAction = {
  type: "SET_UNMUTE_VOLUME";
  unmuteVolume: number;
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
  | SetVolumeStateAction
  | UnmuteAction
  | PauseAction
  | SetUnmuteVolumeAction;

type SideEffectActionType = SideEffectAction["type"];
export type PlayerContextActionType = PlayerContextAction["type"];

export type PlayerProviderAction = SideEffectAction | PlayerContextAction;

export const PLAYER_SIDE_EFFECT_MAP: Record<SideEffectActionType, true> = {
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  CHANGE_VALUE: true,
  AUDIO_FILE_ENDED: true,
  DRAG: true,
  DRAG_END: true,
  STOP_AUDIO: true,
  SET_PLAYBACK_RATE: true,
  UNMUTE: true,
  SET_SLIDER_VALUE: true,
};

export const PLAYER_DISPATCH_MAP: Record<PlayerContextActionType, boolean> = {
  AUDIO_FILE_LOADED: true,
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  TOGGLE_TIME_DISPLAY: true,
  AUDIO_FILE_ENDED: true,
  AUDIO_FILE_ERROR: true,
  CAPTION_CUE_CHANGE: true,
  SET_PLAYBACK_RATE: true,
  SET_VOLUME_STATE: true,
  UNMUTE: true,
  PAUSE: true,
  SET_UNMUTE_VOLUME: false,
};

export type VolumeState = "muted" | "low" | "high";

export type PlayerState = {
  duration: number;
  currentTime: number;
  volume: number;
  playbackRate: number;
  volumeState: VolumeState;
  unmuteVolumeRef: React.MutableRefObject<number>;
};

export type PlayerContextType = {
  handlePlayerAction: (action: PlayerProviderAction) => void;
  playerState: "loading" | "playing" | "paused" | "error";
  isMuted: boolean;
  playbackRate: number;
  volumeState: VolumeState;
  unmuteVolumeRef: React.MutableRefObject<number>;
  getPlayerState: () => PlayerState;
  getDuration: () => number;
  timeDisplay: "elapsed" | "remaining";
  audioFiles: { src: string; captionSrc?: string }[];
  cues: VTTCue[];
};

export const initialState: PlayerContextType = {
  handlePlayerAction: () => {},
  playerState: "loading",
  isMuted: false,
  playbackRate: 1,
  volumeState: "high",
  unmuteVolumeRef: { current: 1 } as React.MutableRefObject<number>,
  getPlayerState: () => ({
    duration: 0,
    currentTime: 0,
    volume: 1,
    playbackRate: 1,
    volumeState: "high",
    unmuteVolumeRef: { current: 1 } as React.MutableRefObject<number>,
  }),
  getDuration: () => 0,
  timeDisplay: "elapsed",
  audioFiles: [],
  cues: [],
};

export const PlayerContext = createContext<PlayerContextType>(initialState);
