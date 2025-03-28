import { useContext, useEffect, useState, useCallback } from "react";
import { AudioContext } from "../AudioElement/AudioContext";

export function useTimeDisplay() {
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const [displayTime, setDisplayTime] = useState({
    elapsed: 0,
    remaining: audioElement?.duration ?? 0,
  });
  const updateTime = useCallback(() => {
    setDisplayTime({
      elapsed: Math.floor(audioElement?.currentTime ?? 0),
      remaining: Math.floor(
        audioElement?.duration ?? 0 - (audioElement?.currentTime ?? 0)
      ),
    });
  }, [audioElement]);

  useEffect(() => {
    if (!audioElement) return;
    setDisplayTime({
      elapsed: Math.floor(audioElement?.currentTime ?? 0),
      remaining: Math.floor(
        audioElement?.duration ?? 0 - (audioElement?.currentTime ?? 0)
      ),
    });
    audioElement.addEventListener("timeupdate", updateTime);
    return () => audioElement.removeEventListener("timeupdate", updateTime);
  }, [updateTime, audioElement]);

  useEffect(() => {
    if (!audioElement) return;
    if (audioElement.paused) return;
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [audioElement, audioElement?.paused, updateTime]);

  return displayTime;
}
