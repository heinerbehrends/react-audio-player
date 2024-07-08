import { AudioPlayerContext } from "./AudioPlayerContext";

export function PlayButton({ children }: { children: React.ReactNode }) {
  const { send } = AudioPlayerContext.useActorRef();
  return (
    <button onClick={() => send({ type: "TOGGLE_PLAY" })}>{children}</button>
  );
}
