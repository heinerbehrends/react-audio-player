import { AudioPlayerContext } from "./AudioPlayerContext";

export function PlayButton({ children }: { children: React.ReactNode }) {
  const { send } = AudioPlayerContext.useActorRef();
  console.log("PlayButton rendered");
  return (
    <button onClick={() => send({ type: "TOGGLE_PLAY" })}>{children}</button>
  );
}
