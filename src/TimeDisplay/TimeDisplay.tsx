/* eslint-disable react-refresh/only-export-components --
   `Time` is a namespace object, not a component, so the parts below reach
   consumers through it rather than being exported individually. Fast refresh
   degrades for this file; a call signature that type-checks and then throws at
   runtime is the worse trade. */
import { formatTime } from "../Shared/formatTime";
import { useStore } from "../store/atom";
import { usePlayerState, useTimeDisplay } from "../store/derived";
import {
  useComposedButtonProps,
  type StatefulButtonPropsBag,
} from "../Shared/useComposedButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useLabels } from "../Player/PlayerConfigContext";
import type { TimeDisplayState } from "../store/createPlayerStore";

type ChildrenProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type TimeProps = React.TimeHTMLAttributes<HTMLTimeElement>;

/**
 * Switches `Time.Elapsed` and `Time.Remaining`. Named for what pressing it will
 * do — "Show time elapsed" / "Show time remaining" — and that name is the only
 * place the state appears; no `aria-pressed` (A4). Translate both with
 * `AudioPlayer`'s `labels.timeToggle`.
 *
 * The choice is player state, so every `Time.Elapsed` and `Time.Remaining` in
 * the tree follows it.
 *
 * Carries `data-part="time-toggle"` and `data-state="elapsed|remaining"` — the
 * readout showing, not the one pressing will show.
 */
function Toggle({ children, ...props }: ChildrenProps) {
  return <button {...useTimeToggleProps(props)}>{children}</button>;
}

/**
 * `Time.Toggle`'s props, for a `<button>` of your own: the flipping "Show time
 * elapsed"/"Show time remaining" name, the toggle, the error gate and the media
 * keys.
 *
 * Spread it last, onto a `<button>`, and pass your own handlers in the call —
 * after the spread they replace the library's rather than composing with it.
 */
export function useTimeToggleProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(props?: P): StatefulButtonPropsBag<P, TimeDisplayState> {
  const store = usePlayerStore();
  const timeDisplay = useStore(store.timeDisplay);
  const labels = useLabels();

  const handleClick = useToggleTimeDisplay();
  const composed = useComposedButtonProps(handleClick, props ?? {});

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  return {
    type: "button",
    "data-part": "time-toggle",
    "data-state": timeDisplay,
    "aria-label":
      labels?.timeToggle?.[timeDisplay] ??
      (timeDisplay === "remaining"
        ? "Show time elapsed"
        : "Show time remaining"),
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as StatefulButtonPropsBag<P, TimeDisplayState>;
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
 * replaces the value rather than adding to it (A12). Pass your own if the
 * context needs spelling out.
 *
 * No `format` prop: the formatting is `AudioPlayer`'s `labels.time`, which names
 * all three readouts at once and is handed raw seconds (S16).
 */
function Elapsed(props: TimeProps) {
  const store = usePlayerStore();
  const timeDisplay = useStore(store.timeDisplay);
  const playerState = usePlayerState();
  const { elapsed } = useTimeDisplay();
  const labels = useLabels();

  if (timeDisplay === "remaining") {
    return null;
  }
  // The loading branch picks the number, not the format: the entry still runs,
  // with `seconds: 0`, so a locale with its own digits gets them.
  const seconds = playerState === "loading" ? 0 : elapsed;
  return (
    <time data-part="elapsed" {...props}>
      {labels?.time?.({ seconds, part: "elapsed" }) ?? formatTime(seconds)}
    </time>
  );
}

/**
 * The time left, negative-signed — `-1:30` — in a
 * `<time data-part="remaining">`.
 *
 * Renders `null` while `Time.Elapsed` is selected. Never counts past zero, and
 * reads `0:00` — unsigned — both before the duration is known and once the track
 * has finished, where a "-0:00" would read as a glitch. No `aria-label`, for the
 * reason given on `Time.Elapsed`.
 *
 * A `labels.time` entry receives the **magnitude** here, with `part:
 * "remaining"` — it writes its own `-`, and the zero cases arrive as `0`.
 */
function Remaining(props: TimeProps) {
  const store = usePlayerStore();
  const timeDisplay = useStore(store.timeDisplay);
  const playerState = usePlayerState();
  const { remaining } = useTimeDisplay();
  const labels = useLabels();

  if (timeDisplay === "elapsed") {
    return null;
  }
  // A magnitude, never a negative: the library owns which number, the entry owns
  // the sign. Zero both before the duration is known and once the track has
  // finished — the entry sees which case it is and can skip its own "-".
  const seconds =
    playerState === "loading" || Math.round(remaining) === 0 ? 0 : remaining;
  return (
    <time data-part="remaining" {...props}>
      {labels?.time?.({ seconds, part: "remaining" }) ??
        (seconds === 0 ? "0:00" : `-${formatTime(seconds)}`)}
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
  const labels = useLabels();
  // Straight through: the store normalises on write, so this is finite and ≥ 0
  // even before metadata and on a live stream (`finite()`, `syncFromElement`).
  return (
    <time data-part="duration" {...props}>
      {labels?.time?.({ seconds: duration, part: "duration" }) ??
        formatTime(duration)}
    </time>
  );
}

/**
 * The time readouts and the toggle between them.
 *
 * A namespace object, not a component: there is no `<Time>` to render, only
 * `Time.Elapsed`, `Time.Remaining`, `Time.Duration` and `Time.Toggle` (S2).
 * `Elapsed` and `Remaining` are two views of one piece of state — render both
 * and exactly one shows.
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
