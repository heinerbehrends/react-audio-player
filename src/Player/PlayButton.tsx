import { useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { useHandleMediaKeys } from "../handleKeys";

type PlayButtonProps = {
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLButtonElement>;

const ariaLabelMap = {
  playing: "Pause audio",
  paused: "Play audio",
  loading: "Loading audio",
  error: "Error loading audio",
};

function PlayButtonComponent({ children, ...props }: PlayButtonProps) {
  const { isPlaying, isDisabled, ariaLabel } = usePlayButtonProps();
  const handleKeyDown = useHandleMediaKeys();
  const handleClick = useHandleClick();

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-pressed={isPlaying}
      {...props}
    >
      {children}
    </button>
  );
}

function useHandleClick() {
  const { handlePlayerAction } = useContext(PlayerContext);
  return () => {
    handlePlayerAction({ type: "TOGGLE_PLAY" });
  };
}

function usePlayButtonProps() {
  const { playerState } = useContext(PlayerContext);
  const isPlaying = playerState === "playing";
  const isDisabled = playerState === "loading" || playerState === "error";
  const ariaLabel = ariaLabelMap[playerState];
  return { isPlaying, isDisabled, ariaLabel };
}

function Playing({ children }: { children: React.ReactNode }) {
  const { playerState } = useContext(PlayerContext);
  const isPlaying = playerState === "playing";
  if (!isPlaying) {
    return null;
  }

  return children;
}

function Paused({ children }: { children: React.ReactNode }) {
  const { playerState } = useContext(PlayerContext);
  const isPlaying = playerState === "playing";
  if (isPlaying) {
    return null;
  }
  return children;
}

type PlayButtonComponent = React.FC<PlayButtonProps> & {
  Playing: React.FC<{ children: React.ReactNode }>;
  Paused: React.FC<{ children: React.ReactNode }>;
};

PlayButtonComponent.Playing = Playing;
PlayButtonComponent.Paused = Paused;
PlayButtonComponent.PlayButton = PlayButtonComponent;

export const PlayButton = PlayButtonComponent;
