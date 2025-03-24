import { useCallback, useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { handleMediaKeys } from "../handleKeys";
type SeekButtonComponentProps = {
  children: React.ReactNode;
  direction: "forward" | "backward";
};

function SeekButtonComponent({
  children,
  direction,
}: SeekButtonComponentProps) {
  const { handlePlayerAction } = useContext(PlayerContext);
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const handleClick = useCallback(() => {
    handlePlayerAction({
      type: "SEEK_TO_TIME",
      component: "timeline",
      time:
        (audioElement?.currentTime ?? 0) + (direction === "forward" ? 10 : -10),
    });
  }, [handlePlayerAction, audioElement, direction]);
  return (
    <button
      aria-label={`Seek ${direction}`}
      onKeyDown={(event) =>
        handleMediaKeys({ event, handlePlayerAction, audioElement })
      }
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

type SeekButtonProps = {
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLButtonElement>;

function Forward({ children, ...props }: SeekButtonProps) {
  return (
    <SeekButtonComponent {...props} direction="forward">
      {children}
    </SeekButtonComponent>
  );
}

function Backward({ children, ...props }: SeekButtonProps) {
  return (
    <SeekButtonComponent {...props} direction="backward">
      {children}
    </SeekButtonComponent>
  );
}

export const SeekButton = Object.assign(SeekButtonComponent, {
  Forward,
  Backward,
});
