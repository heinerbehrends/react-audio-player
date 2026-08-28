import { ChangePlaybackRate } from "./ChangePlaybackRate";
import {
  SetPlaybackRate,
  CurrentIndicator,
  RateDisplay,
} from "./SetPlaybackRate";

/**
 * A labelled group for a set of rate controls — an inline `<span role="group">`,
 * nothing more. Optional: `.Set`, `.Change`, `.Current` and `.Display` all work
 * outside it.
 *
 * Use it when the buttons form one visual cluster, so assistive technology
 * announces them as a set rather than as loose buttons.
 */
export function PlaybackRate({ children }: { children: React.ReactNode }) {
  return (
    <span role="group" aria-label="Playback rate options">
      {children}
    </span>
  );
}

PlaybackRate.Set = SetPlaybackRate;
PlaybackRate.Change = ChangePlaybackRate;
PlaybackRate.Current = CurrentIndicator;
PlaybackRate.Display = RateDisplay;
