import { ChangePlaybackRate } from "./ChangePlaybackRate";
import {
  SetPlaybackRate,
  CurrentIndicator,
  RateDisplay,
} from "./SetPlaybackRate";

type PlaybackComponent = {
  Set: typeof SetPlaybackRate;
  Change: typeof ChangePlaybackRate;
  Current: typeof CurrentIndicator;
  Display: typeof RateDisplay;
};

export const PlaybackRate: PlaybackComponent = Object.assign(
  {},
  {
    Set: SetPlaybackRate,
    Change: ChangePlaybackRate,
    Current: CurrentIndicator,
    Display: RateDisplay,
  }
);
