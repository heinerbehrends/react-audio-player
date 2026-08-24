import { memo } from "react";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { formatTime } from "../Shared/sharedFunctions";
import { useStore } from "../store/atom";
import {
  useIsDisabled,
  usePlayerState,
  useTimeDisplay,
} from "../store/derived";
import { usePlayerStore } from "../store/PlayerStoreContext";

type ChildrenProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Toggle = memo(function Toggle({ children, ...props }: ChildrenProps) {
  const store = usePlayerStore();
  const timeDisplay = useStore(store.timeDisplay);

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

/**
 * `timeDisplay` is the one writable atom — shared UI state that is not on the
 * element — so the toggle writes it directly. `TOGGLE_TIME_DISPLAY` is gone, and
 * it was never in the public action union.
 */
function useToggleTimeDisplay() {
  const store = usePlayerStore();

  return () =>
    store.timeDisplay.set(
      store.timeDisplay.get() === "elapsed" ? "remaining" : "elapsed",
    );
}

// The clock itself stays on `useTimeDisplay` until Phase 4, which is where the
// 1 Hz `setInterval` gives way to `currentSecond`.
const Elapsed = memo(function Elapsed() {
  const store = usePlayerStore();
  const timeDisplay = useStore(store.timeDisplay);
  const playerState = usePlayerState();
  const { elapsed } = useTimeDisplay();

  if (timeDisplay === "remaining") {
    return null;
  }
  if (playerState === "loading") {
    return <time aria-label="elapsed">0:00</time>;
  }
  return <time aria-label="elapsed">{formatTime(elapsed)}</time>;
});

const Remaining = memo(function Remaining() {
  const store = usePlayerStore();
  const timeDisplay = useStore(store.timeDisplay);
  const playerState = usePlayerState();
  const { remaining } = useTimeDisplay();

  if (timeDisplay === "elapsed") {
    return null;
  }
  if (playerState === "loading") {
    return <time aria-label="remaining">0:00</time>;
  }
  return <time aria-label="remaining">-{formatTime(remaining)}</time>;
});

const Duration = memo(function Duration() {
  const store = usePlayerStore();
  const duration = useStore(store.duration);
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
