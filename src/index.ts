export { AudioPlayer } from "./Player/AudioPlayer";
// Opt-in: `AudioPlayer` renders no element of its own (A10).
export { PlayerRoot } from "./Player/PlayerRoot";
export { PlayButton } from "./Player/PlayButton";
export { MuteButton } from "./Player/MuteButton";
export { SeekButton } from "./Player/SeekButton";
export { ErrorMessage } from "./Player/ErrorMessage";
export { Timeline } from "./Timeline/Timeline";
export { TimelineBuffered } from "./Timeline/TimelineBuffered";
export { Volume } from "./Volume/Volume";
export { PlaybackRate } from "./PlaybackRate/PlaybackRate";
export { PlaybackRateSlider } from "./PlaybackRate/PlaybackRateSlider";
export { Time } from "./TimeDisplay/TimeDisplay";
// A part, not root behaviour: every consumer imports `AudioPlayer`, and only
// those who render this pay for the lock screen (F6).
export { MediaSession } from "./MediaSession/MediaSession";
// Individually, not through a barrel: a module importing from every part is the
// aggregated surface that cost 4,025 B → 1,137 B gzipped in P1-a.
export { usePlayerRootProps } from "./Player/PlayerRoot";
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
  useIsLive,
  useIsSeekable,
  useAudioError,
  useTimeDisplay,
} from "./store/derived";
export { useIsVolumeAvailable } from "./store/volumeAvailable";
// The default clock and the numbers behind it, for the one case `labels.time`
// cannot reach: two readouts of the same `part` formatted differently, or
// formatting one of the three and keeping `M:SS` for the others. Without these
// a consumer rendering their own `<time>` has to re-derive `remaining` and
// re-implement the default (S16).
export { formatTime } from "./Shared/formatTime";
export type { Track } from "./Player/PlayerConfigContext";
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
export type { TimeDisplayState } from "./TimeDisplay/TimeDisplay";
