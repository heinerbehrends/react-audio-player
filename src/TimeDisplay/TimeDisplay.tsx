/* eslint-disable react-refresh/only-export-components --
   `Time` is a namespace object, not a component, so the parts below reach
   consumers through it rather than being exported individually. Fast refresh
   degrades for this file; a call signature that type-checks and then throws at
   runtime is the worse trade. */
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { formatTime } from "../Shared/formatTime";
import { useStore } from "../store/atom";
import { usePlayerState, useTimeDisplay } from "../store/derived";
import { useDisabledButtonProps } from "../Shared/useDisabledButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type ChildrenProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Switches `Time.Elapsed` and `Time.Remaining` — whichever is showing, this
 * shows the other. Named for what pressing it will do ("Show time elapsed" /
 * "Show time remaining"), and that name is the only place the state appears; no
 * `aria-pressed`.
 *
 * The choice is player state, not this button's: every `Time.Elapsed` and
 * `Time.Remaining` in the tree follows it.
 */
function Toggle({ children, ...props }: ChildrenProps) {
  const store = usePlayerStore();
  const timeDisplay = useStore(store.timeDisplay);

  const handleClick = useToggleTimeDisplay();
  const handleMediaKeys = useHandleMediaKeys();
  const disabled = useDisabledButtonProps(handleClick, props.onClick);

  return (
    <button
      type="button"
      // Named for what pressing it will do, like the other toggles. "time
      // elapsed" rather than "elapsed": the bare words are the accessible
      // names of the `<time>` elements beside it.
      aria-label={
        timeDisplay === "remaining"
          ? "Show time elapsed"
          : "Show time remaining"
      }
      onKeyDown={handleMediaKeys}
      {...props}
      // Last, so the gate cannot be spread away.
      {...disabled}
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

/**
 * The position, as `M:SS` or `H:MM:SS`, in a `<time>` element named "elapsed".
 *
 * Renders `null` while `Time.Remaining` is the selected display, so the two are
 * a pair: render both and exactly one is visible. Updates once a second, not at
 * the element's ~4 Hz.
 */
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

/**
 * The time left, negative-signed — `-1:30` — in a `<time>` element named
 * "remaining".
 *
 * Renders `null` while `Time.Elapsed` is the selected display. Never counts past
 * zero, and reads `0:00` until the duration is known.
 */
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

/**
 * The track length, in a `<time>` element named "duration". Independent of the
 * elapsed/remaining toggle, so it can sit beside either.
 *
 * Reads `0:00` until metadata arrives, and for a live stream, whose duration is
 * unbounded.
 */
function Duration() {
  const store = usePlayerStore();
  const duration = useStore(store.duration);
  return <time aria-label="duration">{formatTime(duration)}</time>;
}

/**
 * The time readouts and the toggle between them.
 *
 * A namespace object rather than a component — there is no `<Time>` to render,
 * only `Time.Elapsed`, `Time.Remaining`, `Time.Duration` and `Time.Toggle`.
 *
 * `Elapsed` and `Remaining` are two views of one piece of player state: render
 * both and exactly one shows, with `Toggle` switching which.
 *
 * @example
 * ```jsx
 * <Time.Toggle>
 *   <Time.Elapsed />
 *   <Time.Remaining />
 * </Time.Toggle>
 * <span> / </span>
 * <Time.Duration />
 * ```
 */
export const Time = {
  Elapsed,
  Remaining,
  Duration,
  Toggle,
};
