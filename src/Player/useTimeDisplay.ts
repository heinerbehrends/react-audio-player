import { useContext, useEffect, useState, useCallback } from "react";
import { PlayerContext } from "./PlayerContext";

export function useTimeDisplay() {
  const { element } = useContext(PlayerContext);
  const [displayTime, setDisplayTime] = useState({
    elapsed: 0,
    remaining: 0,
  });

  const updateTime = useCallback(() => {
    setDisplayTime({
      elapsed: Math.floor(element?.currentTime ?? 0),
      remaining: Math.floor(
        (element?.duration ?? 0) - (element?.currentTime ?? 0)
      ),
    });
  }, [element]);

  useEffect(() => {
    if (!element) return;
    element.addEventListener("timeupdate", updateTime);
    return () => element.removeEventListener("timeupdate", updateTime);
  }, [element, updateTime]);

  useEffect(() => {
    if (!element) return;
    if (element.paused) return;
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [element, element?.paused, updateTime]);

  return displayTime;
}
