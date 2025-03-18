import { useEffect, useContext, useRef } from "react";
import { TimelineContext } from "./TimelineVolumeContext";
import { PlayerContext } from "../Player/PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
export function useUpdateTime() {
  const { handleTimelineAction } = useContext(TimelineContext);
  const { player } = useContext(PlayerContext);
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (player !== "playing" || !audioElement) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      return;
    }

    const updateTime = () => {
      const currentTime = audioElement.currentTime;
      handleTimelineAction({ type: "UPDATE_TIME", time: currentTime });
      frameRef.current = requestAnimationFrame(updateTime);
    };

    frameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
    };
  }, [player, audioElement, handleTimelineAction]);
}
