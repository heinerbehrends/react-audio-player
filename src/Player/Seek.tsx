import { useCallback, useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { handleMediaKeys } from "../handleKeys";

type SeekButtonComponentProps = {
  children: React.ReactNode;
  amount: number;
};

export function Seek({ children, amount }: SeekButtonComponentProps) {
  const { handlePlayerAction } = useContext(PlayerContext);
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const handleClick = useCallback(() => {
    const time = audioElement?.currentTime ?? 0;
    handlePlayerAction({
      type: "SEEK_TO_TIME",
      component: "timeline",
      time: time + amount,
    });
  }, [handlePlayerAction, audioElement, amount]);
  return (
    <button
      aria-label={`Seek ${amount}`}
      onKeyDown={(event) =>
        handleMediaKeys({ event, handlePlayerAction, audioElement })
      }
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
