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

type TimeProps = React.TimeHTMLAttributes<HTMLTimeElement>;

/**
 * Switches `Time.Elapsed` and `Time.Remaining`. Named for what pressing it will
 * do — "Show time elapsed" / "Show time remaining" — and that name is the only
 * place the state appears; no `aria-pressed`.
 *
 * The choice is player state, not this button's, so every `Time.Elapsed` and
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
      // A4: the name is this button's only state channel, so it flips.
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
 * The position, as `M:SS` or `H:MM:SS`, in a `<time data-part="elapsed">`.
 *
 * Renders `null` while `Time.Remaining` is selected: render both and exactly one
 * shows. Updates once a second, not at the element's ~4 Hz.
 *
 * The time is its own accessible name. No `aria-label`: on a `<time>` one
 * replaces the value rather than adding to it, and `<time>` has no ARIA role to
 * hang a name on (A12). Pass your own if the context needs spelling out.
 */
function Elapsed(props: TimeProps) {
  const store = usePlayerStore();
  const timeDisplay = useStore(store.timeDisplay);
  const playerState = usePlayerState();
  const { elapsed } = useTimeDisplay();

  if (timeDisplay === "remaining") {
    return null;
  }
  return (
    <time data-part="elapsed" {...props}>
      {playerState === "loading" ? "0:00" : formatTime(elapsed)}
    </time>
  );
}

/**
 * The time left, negative-signed — `-1:30` — in a
 * `<time data-part="remaining">`.
 *
 * Renders `null` while `Time.Elapsed` is selected. Never counts past zero, and
 * reads `0:00` until the duration is known. No `aria-label`, for the reason
 * given on `Time.Elapsed`.
 */
function Remaining(props: TimeProps) {
  const store = usePlayerStore();
  const timeDisplay = useStore(store.timeDisplay);
  const playerState = usePlayerState();
  const { remaining } = useTimeDisplay();

  if (timeDisplay === "elapsed") {
    return null;
  }
  return (
    <time data-part="remaining" {...props}>
      {playerState === "loading" ? "0:00" : `-${formatTime(remaining)}`}
    </time>
  );
}

/**
 * The track length, in a `<time data-part="duration">`. Independent of the
 * toggle, so it can sit beside either readout.
 *
 * Reads `0:00` until metadata arrives, and for a live stream. No `aria-label`,
 * for the reason given on `Time.Elapsed`.
 */
function Duration(props: TimeProps) {
  const store = usePlayerStore();
  const duration = useStore(store.duration);
  return (
    <time data-part="duration" {...props}>
      {formatTime(duration)}
    </time>
  );
}

/**
 * The time readouts and the toggle between them.
 *
 * A namespace object, not a component: there is no `<Time>` to render, only
 * `Time.Elapsed`, `Time.Remaining`, `Time.Duration` and `Time.Toggle`.
 *
 * `Elapsed` and `Remaining` are two views of one piece of state — render both
 * and exactly one shows, with `Toggle` switching which.
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
