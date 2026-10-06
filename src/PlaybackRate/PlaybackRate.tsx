/* eslint-disable react-refresh/only-export-components --
   The parts attach to the root through a pure `Object.assign`, so that an
   unused compound component tree-shakes; the rule does not read the result as
   a component. */
import { forwardRef } from "react";
import { ChangePlaybackRate } from "./ChangePlaybackRate";
import { useLabels } from "../Player/PlayerConfigContext";
import {
  SetPlaybackRate,
  CurrentIndicator,
  RateDisplay,
} from "./SetPlaybackRate";

type PlaybackRateProps = {
  /** The rate controls: `.Set`, `.Change`, `.Current` and `.Display`. */
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>;

const PlaybackRateRoot = /* @__PURE__ */ forwardRef<
  HTMLSpanElement,
  PlaybackRateProps
>(function PlaybackRate({ children, ...props }, ref) {
  const labels = useLabels();
  return (
    <span
      data-part="root"
      // Before the spread, so a consumer can still replace it per instance.
      // `role` is after, and cannot be replaced.
      aria-label={labels?.rateGroup ?? "Playback rate options"}
      {...props}
      ref={ref}
      role="group"
    >
      {children}
    </span>
  );
});

type PlaybackRateComponent = React.ForwardRefExoticComponent<
  PlaybackRateProps & React.RefAttributes<HTMLSpanElement>
> & {
  Set: typeof SetPlaybackRate;
  Change: typeof ChangePlaybackRate;
  Current: typeof CurrentIndicator;
  Display: typeof RateDisplay;
};

/**
 * Groups rate controls so assistive technology announces them as a set. Renders
 * a `<span role="group">` named "Playback rate options", and nothing more;
 * `.Set`, `.Change`, `.Current` and `.Display` also work outside it. Carries
 * `data-part="root"`.
 */
export const PlaybackRate: PlaybackRateComponent =
  /* @__PURE__ */ Object.assign(PlaybackRateRoot, {
    Set: SetPlaybackRate,
    Change: ChangePlaybackRate,
    Current: CurrentIndicator,
    Display: RateDisplay,
  });
