import { useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { useHandleMediaKeys } from "../handleKeys";

type PlayButtonProps = {
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLButtonElement>;

const ariaLabel = {
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

function useIsPlaying() {
  const { player: state } = useContext(PlayerContext);
  return state === "playing";
}

function useIsDisabled() {
  const { player: state } = useContext(PlayerContext);
  return state === "loading";
}

function useHandleClick() {
  const { handlePlayerAction } = useContext(PlayerContext);
  return () => {
    handlePlayerAction({ type: "TOGGLE_PLAY" });
  };
}

function useAriaLabel() {
  const isPlaying = useIsPlaying();
  return ariaLabel[isPlaying ? "playing" : "paused"];
}

function usePlayButtonProps() {
  const isPlaying = useIsPlaying();
  const isDisabled = useIsDisabled();
  const ariaLabel = useAriaLabel();
  return { isPlaying, isDisabled, ariaLabel };
}

function Playing({ children }: { children: React.ReactNode }) {
  const isPlaying = useIsPlaying();
  if (!isPlaying) {
    return null;
  }

  return children;
}

function Paused({ children }: { children: React.ReactNode }) {
  const { player: state } = useContext(PlayerContext);
  if (state !== "paused") {
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
