import { useContext, useEffect, useState, memo, useCallback } from "react";
import { PlayerContext } from "./PlayerContext";

function useTimeDisplay() {
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

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const Toggle = memo(function Toggle({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dispatch, timeDisplay } = useContext(PlayerContext);
  const handleClick = useCallback(() => {
    dispatch({ type: "TOGGLE_TIME_DISPLAY" });
  }, [dispatch]);

  return (
    <button
      aria-label="Toggle elapsed and remaining time"
      aria-pressed={timeDisplay === "remaining"}
      onClick={handleClick}
    >
      {children}
    </button>
  );
});

export const Elapsed = memo(function Elapsed() {
  const { player, timeDisplay } = useContext(PlayerContext);
  const { elapsed } = useTimeDisplay();

  if (player === "loading") {
    return <time aria-label="elapsed">0:00</time>;
  }
  if (timeDisplay === "remaining") {
    return null;
  }
  return <time aria-label="elapsed">{formatTime(elapsed)}</time>;
});

export const Remaining = memo(function Remaining() {
  const { player, element, timeDisplay } = useContext(PlayerContext);
  const { remaining } = useTimeDisplay();
  if (!element || player === "loading") {
    return <time aria-label="remaining">0:00</time>;
  }
  if (timeDisplay === "elapsed") {
    return null;
  }
  return <time aria-label="remaining">{formatTime(remaining)}</time>;
});

type ElapsedRemaining = React.NamedExoticComponent<{
  children: React.ReactNode;
}> & {
  Elapsed: React.NamedExoticComponent<{ children: React.ReactNode }>;
  Remaining: React.NamedExoticComponent<{ children: React.ReactNode }>;
};

const ElapsedRemaining = Object.assign({
  Elapsed,
  Remaining,
  Toggle,
});

export default ElapsedRemaining;
