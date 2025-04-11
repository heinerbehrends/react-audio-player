import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";

export function useIsDisabled() {
  const { playerState } = useContext(PlayerContext);
  return playerState === "loading" || playerState === "error";
}
