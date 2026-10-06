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
 * A labelled group for a set of rate controls — an inline `<span role="group">`,
 * nothing more. Optional; `.Set`, `.Change`, `.Current` and `.Display` all work
 * outside it.
 *
 * Use it when the buttons form one cluster, so assistive technology announces
 * them as a set. The one `role="group"` in the library: the slider roots each
 * wrap a single control that is already named, and this wraps several (A11).
 *
 * Translate the group name with `AudioPlayer`'s `labels.rateGroup`, or pass your
 * own `aria-label` to override this one group.
 */
export const PlaybackRate: PlaybackRateComponent =
  /* @__PURE__ */ Object.assign(PlaybackRateRoot, {
    Set: SetPlaybackRate,
    Change: ChangePlaybackRate,
    Current: CurrentIndicator,
    Display: RateDisplay,
  });
