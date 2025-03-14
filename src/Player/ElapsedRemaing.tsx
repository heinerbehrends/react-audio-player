import { useContext, memo, useCallback } from "react";
import { PlayerContext } from "./PlayerContext";
import { useTimeDisplay } from "./useTimeDisplay";

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

export const Elapsed = memo(function Elapsed({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { player, timeDisplay } = useContext(PlayerContext);
  const { elapsed } = useTimeDisplay();

  if (timeDisplay === "remaining") {
    return null;
  }
  if (player === "loading") {
    return <time aria-label="elapsed">0:00</time>;
  }
  return (
    <time aria-label="elapsed">
      {children} {formatTime(elapsed)}
    </time>
  );
});

export const Remaining = memo(function Remaining({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { player, timeDisplay } = useContext(PlayerContext);
  const { remaining } = useTimeDisplay();
  if (timeDisplay === "elapsed") {
    return null;
  }
  if (player === "loading") {
    return <time aria-label="remaining">0:00</time>;
  }
  return (
    <time aria-label="remaining">
      {children} -{formatTime(remaining)}
    </time>
  );
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
