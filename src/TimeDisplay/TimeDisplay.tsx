/* eslint-disable react-refresh/only-export-components --
   `Time` is a namespace object, not a component, so the parts below reach
   consumers through it rather than being exported individually. Fast refresh
   degrades for this file; a call signature that type-checks and then throws at
   runtime is the worse trade. */
import { forwardRef, useState } from "react";
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
 * A `<time>` element's attributes, without `children`: the readout renders its
 * own text. Change that text with `labels.time`.
 */
type TimeProps = Omit<
  React.TimeHTMLAttributes<HTMLTimeElement>,
  "children" | "dangerouslySetInnerHTML"
>;

const Toggle = /* @__PURE__ */ forwardRef<HTMLButtonElement, ToggleProps>(
  function Toggle({ defaultValue = "elapsed", ...props }, ref) {
    // The state, not the bag's `data-state`, which `props` can replace (S30).
    const [shown, toggle] = useTimeToggle(defaultValue, props);
    return (
      <button {...toggle} ref={ref}>
        {shown === "elapsed" ? <Elapsed /> : <Remaining />}
      </button>
    );
  },
);

/**
 * `Time.Toggle`'s props for a `<button>` of your own. Render `Time.Elapsed` or
 * `Time.Remaining` inside it from the result's `data-state`, and pass no
 * `data-state` of your own. Pass your props in the call and spread the result
 * last.
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

const Elapsed = /* @__PURE__ */ forwardRef<HTMLTimeElement, TimeProps>(
  function Elapsed(props, ref) {
    return (
      <time data-part="elapsed" {...props} ref={ref}>
        {useReadoutText("elapsed")}
      </time>
    );
  },
);

const Remaining = /* @__PURE__ */ forwardRef<HTMLTimeElement, TimeProps>(
  function Remaining(props, ref) {
    return (
      <time data-part="remaining" {...props} ref={ref}>
        {useReadoutText("remaining")}
      </time>
    );
  },
);

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

const Duration = /* @__PURE__ */ forwardRef<HTMLTimeElement, TimeProps>(
  function Duration(props, ref) {
    const store = usePlayerStore();
    const duration = useStore(store.duration);
    const labels = useLabels();
    // Finite and ≥ 0 without a guard: `duration` is `finite()`-wrapped at every
    // write, so neither `NaN` before metadata nor a live stream's `Infinity`
    // reaches here (`syncFromElement`). Rounded for the reason given on
    // `Time.Remaining`.
    const seconds = Math.round(duration);
    return (
      <time data-part="duration" {...props} ref={ref}>
        {labels?.time?.({ seconds, part: "duration" }) ?? formatTime(seconds)}
      </time>
    );
  },
);

/**
 * The time readouts and the toggle between them. A namespace, not a component:
 * render `Time.Elapsed`, `Time.Remaining`, `Time.Duration` or `Time.Toggle`.
 */
export const Time = {
  /**
   * The position, as `M:SS` or `H:MM:SS`. Renders a `<time data-part="elapsed">`
   * that updates once a second. The text is its own accessible name.
   */
  Elapsed,
  /**
   * The time left, as `-1:30`. Renders a `<time data-part="remaining">` that
   * reads `0:00` before the duration is known and once the track has ended.
   */
  Remaining,
  /**
   * The track length. Renders a `<time data-part="duration">` that reads `0:00`
   * until metadata arrives, and on a live stream.
   */
  Duration,
  /**
   * Shows the elapsed or the remaining time and switches on press. Renders a
   * `<button>` containing the readout, so it takes no children, named by the
   * time shown and then what pressing does: "1:23 elapsed, show time remaining".
   * Carries `data-part="time-toggle"` and `data-state="elapsed" | "remaining"`,
   * the readout showing.
   */
  Toggle,
};
