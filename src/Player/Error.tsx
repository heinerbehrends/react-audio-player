import { useContext } from "react";
import { PlayerContext } from "./PlayerContext";

export function Error({ children }: { children: React.ReactNode }) {
  const { player } = useContext(PlayerContext);
  if (player === "error") {
    return <div>{children}</div>;
  }
  return null;
}
