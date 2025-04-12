import { PlayerProviderAction, VolumeState } from "../Player/PlayerContext";
import { PlayerState } from "../Player/PlayerContext";
import { handleMediaKeys } from "./handleMediaKeys";

type ActionHandler<T> = (action: T) => void;

export type HandleKeyDownProps = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  handlePlayerAction: ActionHandler<PlayerProviderAction>;
  getPlayerState: () => PlayerState;
  playbackRate: number;
  volumeState: VolumeState;
  type: "timeline" | "volume";
};

export function handleSliderKeys({
  event,
  handlePlayerAction,
  getPlayerState,
  type,
  playbackRate,
  volumeState,
}: HandleKeyDownProps) {
  if (
    handleMediaKeys({
      event,
      handlePlayerAction,
      getPlayerState,
      isVolume: type === "volume",
      playbackRate,
      volumeState,
    })
  ) {
    return;
  }
  if (["Enter", " "].includes(event.key)) {
    handlePlayerAction({ type: "TOGGLE_PLAY" });
    event.preventDefault();
    return true;
  }
  return false;
}
