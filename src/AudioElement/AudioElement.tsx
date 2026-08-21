import { memo, useCallback, useEffect, useState } from "react";
import { usePlayerContext } from "../Player/PlayerContext";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useAudioContext } from "./AudioContext";
import {
  useHandleTimeUpdate,
  useHandleVolumeChange,
  useHandlePlaybackRateChange,
  usePlayerCallbacks,
} from "./audioElementHooks";

type AudioElementProps = React.AudioHTMLAttributes<HTMLAudioElement> & {
  children?: React.ReactNode;
};

export const AudioElement = memo(function AudioElement({
  children,
  ...props
}: AudioElementProps) {
  const { audioFiles } = usePlayerContext();
  const {
    audioElementRef,
    timelineCallbackRef,
    volumeCallbackRef,
    playbackRateCallbackRef,
  } = useAudioContext();
  const { src } = audioFiles?.[0] || {};
  const handleTimeUpdate = useHandleTimeUpdate();
  const handleVolumeChange = useHandleVolumeChange();
  const handlePlaybackRateChange = useHandlePlaybackRateChange();

  const {
    handleEnded,
    handleError,
    handleLoadedMetadata,
    handlePlayPause,
    handleDurationChange,
  } = usePlayerCallbacks();

  // `AudioElement` renders the `<audio>` tag, so it is the only component that
  // can hand the element to the store without a setter travelling down — and a
  // setter reachable through context would be a second write-shaped door on a
  // store whose whole design is that `attach` is the only one.
  const store = usePlayerStore();
  const [element, setElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => (element ? store.attach(element) : undefined), [
    element,
    store,
  ]);

  // `setElement` is stable by React's `useState` guarantee, so the composed ref
  // is stable and this component's `memo` cannot cause a detach/reattach on
  // every parent render. Collapses to `setElement` when the legacy ref goes.
  const ref = useCallback(
    (node: HTMLAudioElement | null) => {
      audioElementRef.current = node;
      setElement(node);
    },
    [audioElementRef],
  );

  const hasTimelineCallback =
    !!timelineCallbackRef?.current?.handleTimelineAction;
  const hasVolumeCallback = !!volumeCallbackRef?.current?.handleVolumeAction;
  const hasPlaybackRateCallback =
    !!playbackRateCallbackRef?.current?.handlePlaybackRateAction;
  return (
    <audio
      {...props}
      src={src}
      aria-label="audio player"
      ref={ref}
      onSeeked={hasTimelineCallback ? handleTimeUpdate : undefined}
      onVolumeChange={hasVolumeCallback ? handleVolumeChange : undefined}
      onRateChange={
        hasPlaybackRateCallback ? handlePlaybackRateChange : undefined
      }
      onTimeUpdate={hasTimelineCallback ? handleTimeUpdate : undefined}
      onEnded={() =>
        handleEnded(timelineCallbackRef?.current?.handleTimelineAction)
      }
      onError={handleError}
      onPause={handlePlayPause}
      onPlay={handlePlayPause}
      onLoadedMetadata={() => {
        handleLoadedMetadata(
          timelineCallbackRef?.current?.handleTimelineAction,
        );
      }}
      onDurationChange={() => {
        handleDurationChange(
          timelineCallbackRef?.current?.handleTimelineAction,
        );
      }}
    >
      {children ? children : undefined}
    </audio>
  );
});
