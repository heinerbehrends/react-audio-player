export { AudioPlayer } from "./Player/AudioPlayer";
export { PlayButton } from "./Player/PlayButton";
export { MuteButton } from "./Player/MuteButton";
export { SeekButton } from "./Player/SeekButton";
export { ErrorMessage } from "./Player/ErrorMessage";
export { Timeline } from "./Timeline/Timeline";
export { Volume } from "./Volume/Volume";
export { PlaybackRate } from "./PlaybackRate/PlaybackRate";
export { PlaybackRateSlider } from "./PlaybackRate/PlaybackRateSlider";
export { Time } from "./TimeDisplay/TimeDisplay";
// Individually, not through a barrel: a module importing from every part is the
// aggregated surface that cost 4,025 B → 1,137 B gzipped in P1-a.
export { usePlayButtonProps } from "./Player/PlayButton";
export { useMuteButtonProps } from "./Player/MuteButton";
export { useSeekButtonProps } from "./Player/SeekButton";
export { useTimeToggleProps } from "./TimeDisplay/TimeDisplay";
export { usePlaybackRateSetProps } from "./PlaybackRate/SetPlaybackRate";
export { usePlaybackRateChangeProps } from "./PlaybackRate/ChangePlaybackRate";
export {
  useAudioPlayer,
  useCurrentSecond,
  useCurrentTime,
} from "./store/useAudioPlayer";
export {
  useIsAtEnd,
  useIsBuffering,
  useIsSeekable,
  useAudioError,
} from "./store/derived";
export type { AudioFile } from "./Player/PlayerConfigContext";
export type { KeyboardAction } from "./AudioElement/sideEffectActions";
export type { KeyToActionMap } from "./KeyboardControls/handleMediaKeys";
export type {
  AudioPlayerState,
  AudioPlayerControls,
} from "./store/useAudioPlayer";
export type {
  AudioError,
  MediaErrorReason,
  PlayerState,
  VolumeState,
} from "./store/derived";
