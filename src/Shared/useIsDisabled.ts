import { usePlayerContext } from "../Player/PlayerContext";

export function useIsDisabled() {
  const { playerState } = usePlayerContext();
  return playerState === "loading" || playerState === "error";
}
