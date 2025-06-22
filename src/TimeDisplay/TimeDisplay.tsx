import { useContext, memo, useCallback } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { useTimeDisplay } from "./useTimeDisplay";
import { useIsDisabled } from "../Shared/useIsDisabled";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { formatTime } from "../Shared/sharedFunctions";

type ChildrenProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Toggle = memo(function Toggle({ children, ...props }: ChildrenProps) {
  const { timeDisplay } = useContext(PlayerContext);

  const handleClick = useToggleTimeDisplay();
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

function useToggleTimeDisplay() {
  const { handlePlayerAction } = useContext(PlayerContext);

  return useCallback(() => {
    handlePlayerAction({ type: "TOGGLE_TIME_DISPLAY" });
  }, [handlePlayerAction]);
}

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
  const { duration } = useContext(PlayerContext);
  console.log("duration", duration);
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
