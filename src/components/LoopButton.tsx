import { ReactNode } from "react";
import { AudioPlayerContext } from "./AudioPlayerContext";

export function LoopButton({ children }: { children: ReactNode }) {
  const { send } = AudioPlayerContext.useActorRef();
  return (
    <button onClick={() => send({ type: "TOGGLE_LOOP" })}>{children}</button>
  );
}
