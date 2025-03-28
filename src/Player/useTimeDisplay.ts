import { useContext, useEffect, useState, useCallback } from "react";
import { AudioContext } from "../AudioElement/AudioContext";
import { PlayerContext } from "./PlayerContext";

export function useTimeDisplay() {
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const { getPlayerState } = useContext(PlayerContext);
  const { duration, currentTime } = getPlayerState();
  const [displayTime, setDisplayTime] = useState({
    elapsed: 0,
    remaining: duration,
  });
  const updateTime = useCallback(() => {
    setDisplayTime({
      elapsed: Math.floor(currentTime),
      remaining: Math.floor(duration - currentTime),
    });
  }, [currentTime, duration]);

  useEffect(() => {
    if (!audioElement) return;
    setDisplayTime({
      elapsed: Math.floor(currentTime),
      remaining: Math.floor(duration - currentTime),
    });
    audioElement.addEventListener("timeupdate", updateTime);
    return () => audioElement.removeEventListener("timeupdate", updateTime);
  }, [currentTime, duration, updateTime, audioElement]);

  useEffect(() => {
    if (!audioElement) return;
    if (audioElement.paused) return;
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [audioElement, audioElement?.paused, updateTime]);

  return displayTime;
}
