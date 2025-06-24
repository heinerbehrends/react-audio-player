import { useRef } from "react";
import { useCueChange } from "./captionsHooks";

type TrackProps = {
  src: string;
};

export function Track({ src }: TrackProps) {
  const trackRef = useRef<HTMLTrackElement | null>(null);
  useCueChange({
    trackRef,
  });

  return <track ref={trackRef} kind="captions" src={src} default />;
}
