import { useContext, useEffect, useState, memo, useCallback } from "react";
import { PlayerContext } from "./PlayerContext";

function useTimeDisplay() {
  const { element } = useContext(PlayerContext);
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    if (!element) return;

    const interval = setInterval(() => {
      setDisplayTime(Math.floor(element.currentTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [element]);

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
      aria-label="Toggle between elapsed and remaining time"
      aria-pressed={timeDisplay === "remaining"}
      onClick={handleClick}
    >
      {children}
    </button>
  );
});

export const Elapsed = memo(function Elapsed() {
  const { player, timeDisplay } = useContext(PlayerContext);
  const displayTime = useTimeDisplay();

  if (player === "loading") {
    return <time aria-label="elapsed">0:00</time>;
  }
  if (timeDisplay === "remaining") {
    return null;
  }
  return <time aria-label="elapsed">{formatTime(displayTime)}</time>;
});

export const Remaining = memo(function Remaining() {
  const { player, element, timeDisplay } = useContext(PlayerContext);
  const displayTime = useTimeDisplay();
  if (!element || player === "loading") {
    return <time aria-label="remaining">0:00</time>;
  }
  if (timeDisplay === "elapsed") {
    return null;
  }
  const remaining = Math.floor(element.duration - displayTime);
  return <time aria-label="remaining">{formatTime(remaining)}</time>;
});

type ElapsedRemainingComponent = React.NamedExoticComponent<{
  children: React.ReactNode;
}> & {
  Elapsed: React.NamedExoticComponent<{ children: React.ReactNode }>;
  Remaining: React.NamedExoticComponent<{ children: React.ReactNode }>;
};

const ElapsedRemainingComponent = Object.assign({
  Elapsed,
  Remaining,
  Toggle,
});

export default ElapsedRemainingComponent;
