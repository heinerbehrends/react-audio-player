/* eslint-disable react-refresh/only-export-components --
   `Time` is a namespace object, not a component, so the parts below reach
   consumers through it rather than being exported individually. Fast refresh
   degrades for this file; a call signature that type-checks and then throws at
   runtime is the worse trade. */
import { useState } from "react";
import { formatTime } from "../Shared/formatTime";
import { useStore } from "../store/atom";
import { usePlayerState, useTimeDisplay } from "../store/derived";
import {
  useComposedButtonProps,
  type StatefulButtonPropsBag,
} from "../Shared/useComposedButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useLabels } from "../Player/PlayerConfigContext";

/** Which readout a `Time.Toggle` is showing. */
export type TimeDisplayState = "elapsed" | "remaining";

/**
 * No `children`: the toggle renders its own readout. `defaultValue` is the DOM
 * attribute's name, meaningless on a `<button>`, so it is redefined here.
 */
type ToggleProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "dangerouslySetInnerHTML" | "defaultValue"
> & {
  /**
   * The readout shown until the first press. Read once, on mount.
   *
   * @defaultValue "elapsed"
   */
  defaultValue?: TimeDisplayState;
};

/**
 * `children` and `dangerouslySetInnerHTML` are omitted because the readout's
 * own text occupies that slot: JSX children are `createElement`'s third
 * argument, so anything passed through the props bag was silently discarded and
 * the two together throw. Omitting them turns both into compile errors that
 * point at `labels.time`, which is where per-readout text belongs (A15, S16).
 */
type TimeProps = Omit<
  React.TimeHTMLAttributes<HTMLTimeElement>,
  "children" | "dangerouslySetInnerHTML"
>;

/**
 * A button showing the elapsed or the remaining time, switching between them
 * when pressed. Renders the readout itself, as `Time.Elapsed` or
 * `Time.Remaining` would, so it takes no children. For a readout that never
 * switches, render one of those on its own.
 *
 * Named by the time on screen, then what pressing does — "1:23 elapsed, show
 * time remaining" — so the name contains the visible text (WCAG 2.5.3, A17).
 * The name is the only place the state appears; no `aria-pressed` (A4).
 * Translate it with `AudioPlayer`'s `labels.timeToggle`.
 *
 * The choice is this toggle's own: two toggles switch independently.
 *
 * Carries `data-part="time-toggle"` and `data-state="elapsed|remaining"` — the
 * readout showing, not the one pressing will show.
 */
function Toggle({ defaultValue = "elapsed", ...props }: ToggleProps) {
  // The state, not the bag's `data-state`, which `props` can replace (S30).
  const [shown, toggle] = useTimeToggle(defaultValue, props);
  return (
    <button {...toggle}>
      {shown === "elapsed" ? <Elapsed /> : <Remaining />}
    </button>
  );
}

/**
 * `Time.Toggle`'s props, for a `<button>` of your own: the state, the name
 * ("1:23 elapsed, show time remaining"), the toggle, the error gate and the
 * media keys. Render the readout yourself from `data-state`:
 * `Time.Elapsed` or `Time.Remaining`. Pass no `data-state` of your own — it
 * replaces the bag's, which then no longer says which readout is showing.
 *
 * Spread it last, onto a `<button>`, and pass your own handlers in the call —
 * after the spread they replace the library's rather than composing with it.
 */
export function useTimeToggleProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(
  defaultValue: TimeDisplayState = "elapsed",
  props?: P,
): StatefulButtonPropsBag<P, TimeDisplayState> {
  return useTimeToggle(defaultValue, props)[1];
}

/** `useTimeToggleProps`, plus the state itself, which `props` cannot replace. */
function useTimeToggle<P extends React.ButtonHTMLAttributes<HTMLButtonElement>>(
  defaultValue: TimeDisplayState = "elapsed",
  props?: P,
): [TimeDisplayState, StatefulButtonPropsBag<P, TimeDisplayState>] {
  const [timeDisplay, setTimeDisplay] = useState(defaultValue);
  const labels = useLabels();
  const time = useReadoutText(timeDisplay);

  const composed = useComposedButtonProps(
    () =>
      setTimeDisplay((shown) =>
        shown === "elapsed" ? "remaining" : "elapsed",
      ),
    props ?? {},
  );

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  const bag = {
    type: "button",
    "data-part": "time-toggle",
    "data-state": timeDisplay,
    // Starts with the text on screen, so a voice-control user can say it (WCAG
    // 2.5.3), then says what pressing does.
    "aria-label":
      labels?.timeToggle?.({ time, shown: timeDisplay }) ??
      `${time} ${timeDisplay}, show time ${
        timeDisplay === "elapsed" ? "remaining" : "elapsed"
      }`,
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as StatefulButtonPropsBag<P, TimeDisplayState>;
  return [timeDisplay, bag];
}

/**
 * The position, as `M:SS` or `H:MM:SS`, in a `<time data-part="elapsed">`.
 *
 * Updates once a second, not at the element's ~4 Hz.
 *
 * The time is its own accessible name. No `aria-label`: on a `<time>` one
 * replaces the value rather than adding to it (A12). Pass your own if the
 * context needs spelling out.
 *
 * No `format` prop: the formatting is `AudioPlayer`'s `labels.time`, which names
 * all three readouts at once and is handed raw seconds (S16).
 */
function Elapsed(props: TimeProps) {
  return (
    <time data-part="elapsed" {...props}>
      {useReadoutText("elapsed")}
    </time>
  );
}

/**
 * The time left, negative-signed — `-1:30` — in a
 * `<time data-part="remaining">`.
 *
 * Never counts past zero, and
 * reads `0:00` — unsigned — both before the duration is known and once the track
 * has finished, where a "-0:00" would read as a glitch. No `aria-label`, for the
 * reason given on `Time.Elapsed`.
 *
 * A `labels.time` entry receives the **magnitude** here, with `part:
 * "remaining"` — it writes its own `-`, and the zero cases arrive as `0`.
 */
function Remaining(props: TimeProps) {
  return (
    <time data-part="remaining" {...props}>
      {useReadoutText("remaining")}
    </time>
  );
}

/**
 * What `Time.Elapsed` or `Time.Remaining` renders, shared with the toggle's
 * name so the two cannot disagree.
 */
function useReadoutText(part: TimeDisplayState) {
  const playerState = usePlayerState();
  const { elapsed, remaining } = useTimeDisplay();
  const labels = useLabels();

  // The loading branch picks the number, not the format: the entry still runs,
  // with `seconds: 0`, so a locale with its own digits gets them.
  //
  // A magnitude, never a negative, and **whole seconds**: `duration -
  // currentSecond` is fractional on most tracks, and `formatTime` rounds — so
  // handing the entry the float made an entry that floors render a second below
  // the fallback, and turned the last half-second into the `-0:00` this
  // component exists to avoid. What the entry is given is what the fallback
  // would render, the same rule the sliders and `rateDisplay` follow.
  //
  // Zero both before the duration is known and once the track has finished — the
  // entry sees which case it is and can skip its own "-".
  const seconds =
    playerState === "loading"
      ? 0
      : Math.round(part === "elapsed" ? elapsed : remaining);
  const custom = labels?.time?.({ seconds, part });
  if (custom !== undefined) return custom;
  if (part === "elapsed" || seconds === 0) return formatTime(seconds);
  return `-${formatTime(seconds)}`;
}

/**
 * The track length, in a `<time data-part="duration">`.
 *
 * Reads `0:00` until metadata arrives, and for a live stream. No `aria-label`,
 * for the reason given on `Time.Elapsed`.
 */
function Duration(props: TimeProps) {
  const store = usePlayerStore();
  const duration = useStore(store.duration);
  const labels = useLabels();
  // Finite and ≥ 0 without a guard: `duration` is `finite()`-wrapped at every
  // write, so neither `NaN` before metadata nor a live stream's `Infinity`
  // reaches here (`syncFromElement`). Rounded for the reason given on
  // `Time.Remaining`.
  const seconds = Math.round(duration);
  return (
    <time data-part="duration" {...props}>
      {labels?.time?.({ seconds, part: "duration" }) ?? formatTime(seconds)}
    </time>
  );
}

/**
 * The time readouts and the toggle between them.
 *
 * A namespace object, not a component: there is no `<Time>` to render, only
 * `Time.Elapsed`, `Time.Remaining`, `Time.Duration` and `Time.Toggle` (S2).
 * Each readout always shows its own number; the toggle shows one of the first
 * two and switches on press.
 *
 * @example
 * ```jsx
 * <Time.Toggle defaultValue="remaining" />
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
