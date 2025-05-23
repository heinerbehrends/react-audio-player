import { ChangePlaybackRate } from "./ChangePlaybackRate";
import {
  SetPlaybackRate,
  CurrentIndicator,
  RateDisplay,
} from "./SetPlaybackRate";

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
