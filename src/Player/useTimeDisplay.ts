import { useContext, useEffect, useState, useCallback } from "react";
import { AudioContext } from "../AudioElement/AudioContext";

export function useTimeDisplay() {
  const { audioElement } = useContext(AudioContext);
  const [displayTime, setDisplayTime] = useState({
    elapsed: 0,
    remaining: 0,
  });

  const updateTime = useCallback(() => {
    setDisplayTime({
      elapsed: Math.floor(audioElement?.currentTime ?? 0),
      remaining: Math.floor(
        (audioElement?.duration ?? 0) - (audioElement?.currentTime ?? 0)
      ),
    });
  }, [audioElement]);

  useEffect(() => {
    if (!audioElement) return;
    audioElement.addEventListener("timeupdate", updateTime);
    return () => audioElement.removeEventListener("timeupdate", updateTime);
  }, [audioElement, updateTime]);

  useEffect(() => {
    if (!audioElement) return;
    if (audioElement.paused) return;
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [audioElement, audioElement?.paused, updateTime]);

  return displayTime;
}
