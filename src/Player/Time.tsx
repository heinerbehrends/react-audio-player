import { useContext, memo, useCallback } from "react";
import { PlayerContext } from "./PlayerContext";
import { useTimeDisplay } from "./useTimeDisplay";
import { handleMediaKeys } from "../handleKeys";
import { AudioContext } from "../AudioElement/AudioContext";

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type ChildrenProps = {
  children: React.ReactNode;
};

const Toggle = memo(function Toggle({ children }: ChildrenProps) {
  const { handlePlayerAction, timeDisplay } = useContext(PlayerContext);
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);

  const handleClick = useCallback(() => {
    handlePlayerAction({ type: "TOGGLE_TIME_DISPLAY" });
  }, [handlePlayerAction]);

  return (
    <button
      aria-label="Toggle elapsed and remaining time"
      aria-pressed={timeDisplay === "remaining"}
      onKeyDown={(event) => {
        handleMediaKeys({
          event,
          handlePlayerAction,
          audioElement,
        });
      }}
      onClick={handleClick}
    >
      {children}
    </button>
  );
});

const Elapsed = memo(function Elapsed({ children }: ChildrenProps) {
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

const Remaining = memo(function Remaining({ children }: ChildrenProps) {
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

type Time = React.NamedExoticComponent<{
  children: React.ReactNode;
}> & {
  Elapsed: React.NamedExoticComponent<{ children: React.ReactNode }>;
  Remaining: React.NamedExoticComponent<{ children: React.ReactNode }>;
};

export const Time = Object.assign({
  Elapsed,
  Remaining,
  Toggle,
});
