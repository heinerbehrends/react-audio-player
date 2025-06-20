import { useContext, useRef } from "react";
import { useCueChange } from "./captionsHooks";
import { PlayerContext } from "../Player/PlayerContext";

type TrackProps = {
  src: string;
};

export function Track({ src }: TrackProps) {
  const { handlePlayerAction } = useContext(PlayerContext);
  const trackRef = useRef<HTMLTrackElement | null>(null);
  useCueChange({ trackRef, handlePlayerAction });
  return <track ref={trackRef} kind="captions" src={src} default />;
}
