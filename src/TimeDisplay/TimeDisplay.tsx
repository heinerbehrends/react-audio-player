/* eslint-disable react-refresh/only-export-components --
   `Time` is a namespace object, not a component, so the parts below reach
   consumers through it rather than being exported individually. Fast refresh
   degrades for this file; a call signature that type-checks and then throws at
   runtime is the worse trade. */
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
      type="button"
      // Named for what pressing it will do, like the other toggles: state on
      // the name only, never on the name and `aria-pressed` at once. The name
      // avoids the bare words "elapsed" and "remaining", which are the
      // accessible names of the `<time>` elements this button sits beside.
      aria-label={
        timeDisplay === "remaining"
          ? "Show time elapsed"
          : "Show time remaining"
      }
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

/**
 * A namespace, not a component: there is no root element to render, so unlike
 * the sliders `Time` carries no call signature. Typing it as one made
 * `<Time>…</Time>` compile and then throw at runtime.
 */
export const Time = {
  Elapsed,
  Remaining,
  Duration,
  Toggle,
};
