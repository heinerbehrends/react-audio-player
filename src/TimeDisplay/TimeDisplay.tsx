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

function Toggle({ children, ...props }: ChildrenProps) {
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
}

/** `timeDisplay` is the one writable atom, so the toggle writes it directly. */
function useToggleTimeDisplay() {
  const store = usePlayerStore();

  return () =>
    store.timeDisplay.set(
      store.timeDisplay.get() === "elapsed" ? "remaining" : "elapsed",
    );
}

function Elapsed() {
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
}

function Remaining() {
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
}

function Duration() {
  const store = usePlayerStore();
  const duration = useStore(store.duration);
  return <time aria-label="duration">{formatTime(duration)}</time>;
}

type Time = React.FC<{
  children: React.ReactNode;
}> & {
  Elapsed: React.FC;
  Remaining: React.FC;
  Duration: React.FC;
  Toggle: React.FC<{ children: React.ReactNode }>;
};

export const Time: Time = Object.assign({
  Elapsed,
  Remaining,
  Duration,
  Toggle,
});
