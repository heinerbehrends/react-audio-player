import { useContext, memo, useCallback } from "react";
import { PlayerContext } from "./PlayerContext";
import { useTimeDisplay } from "./useTimeDisplay";
import { useHandleMediaKeys } from "../handleKeys";
import { useIsDisabled } from "../useIsDisabled";

type ChildrenProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Toggle = memo(function Toggle({ children, ...props }: ChildrenProps) {
  const { handlePlayerAction, timeDisplay } = useContext(PlayerContext);

  const handleClick = useCallback(() => {
    handlePlayerAction({ type: "TOGGLE_TIME_DISPLAY" });
  }, [handlePlayerAction]);
  const isDisabled = useIsDisabled();
  const handleMediaKeys = useHandleMediaKeys();

  return (
    <button
      aria-label="Toggle elapsed and remaining time"
      aria-pressed={timeDisplay === "remaining"}
      onKeyDown={handleMediaKeys}
      onClick={handleClick}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
});

const Elapsed = memo(function Elapsed() {
  const { playerState: player, timeDisplay } = useContext(PlayerContext);
  const { elapsed } = useTimeDisplay();

  if (timeDisplay === "remaining") {
    return null;
  }
  if (player === "loading") {
    return <time aria-label="elapsed">0:00</time>;
  }
  return <time aria-label="elapsed">{formatTime(elapsed)}</time>;
});

const Remaining = memo(function Remaining() {
  const { playerState: player, timeDisplay } = useContext(PlayerContext);
  const { remaining } = useTimeDisplay();

  if (timeDisplay === "elapsed") {
    return null;
  }
  if (player === "loading") {
    return <time aria-label="remaining">0:00</time>;
  }
  return <time aria-label="remaining">-{formatTime(remaining)}</time>;
});

const Duration = memo(function Duration() {
  const { getPlayerState } = useContext(PlayerContext);
  const { duration } = getPlayerState();
  return <time aria-label="duration">{formatTime(duration)}</time>;
});

type Time = React.NamedExoticComponent<{
  children: React.ReactNode;
}> & {
  Elapsed: React.NamedExoticComponent;
  Remaining: React.NamedExoticComponent;
  Duration: React.NamedExoticComponent;
  Toggle: React.NamedExoticComponent<{ children: React.ReactNode }>;
};

export const Time: Time = Object.assign({
  Elapsed,
  Remaining,
  Duration,
  Toggle,
});

function formatTime(time: number) {
  const roundedTime = Math.round(time);
  const minutes = Math.floor(roundedTime / 60);
  const seconds = roundedTime % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
