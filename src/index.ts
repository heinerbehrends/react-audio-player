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
  useTimeDisplay,
} from "./store/derived";
// The default clock and the numbers behind it, for the one case `labels.time`
// cannot reach: two readouts of the same `part` formatted differently, or
// formatting one of the three and keeping `M:SS` for the others. Without these
// a consumer rendering their own `<time>` has to re-derive `remaining` and
// re-implement the default (S16).
export { formatTime } from "./Shared/formatTime";
export type { AudioFile } from "./Player/PlayerConfigContext";
export type { PlayerLabels, TimePart } from "./Shared/playerLabels";
export type { SliderAriaState } from "./Slider/sliderModes";
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
export type { TimeDisplayState } from "./store/createPlayerStore";
