import { ChangePlaybackRate } from "./ChangePlaybackRate";
import { SetPlaybackRate } from "./SetPlaybackRate";

type PlaybackComponent = {
  Set: typeof SetPlaybackRate;
  Change: typeof ChangePlaybackRate;
};

export const PlaybackRate: PlaybackComponent = Object.assign(
  {},
  {
    Set: SetPlaybackRate,
    Change: ChangePlaybackRate,
  }
);
