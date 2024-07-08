import { useRef } from "react";
import { AudioPlayerContext } from "./ActorContext";

export function AudioElement() {
  const { send } = AudioPlayerContext.useActorRef();
  const audioRef = useRef<HTMLAudioElement>(null);
  return (
    <audio
      ref={audioRef}
      src="The-Race.mp3"
      onCanPlay={() => {
        send({ type: "LOADED", ref: audioRef.current });
      }}
      onEnded={() => {
        send({ type: "END_OF_TRACK" });
      }}
    />
  );
}
