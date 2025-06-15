import { useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useHandleSideEffect } from "../AudioElement/useHandleSideEffect";

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
  const { playerState } = useContext(PlayerContext);
  const handleSideEffect = useHandleSideEffect();
  return () => {
    if (playerState === "playing") {
      handleSideEffect({ type: "PAUSE" });
      return;
    }
    handleSideEffect({ type: "PLAY" });
  };
}

function usePlayButtonProps() {
  const { playerState } = useContext(PlayerContext);
  const isPlaying = playerState === "playing";
  const isDisabled = playerState === "loading" || playerState === "error";
  const ariaLabel = ariaLabelMap[playerState];
  return { isPlaying, isDisabled, ariaLabel };
}

function Playing({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement | null {
  const { playerState } = useContext(PlayerContext);
  const isPlaying = playerState === "playing";
  if (!isPlaying) {
    return null;
  }

  return <>{children}</>;
}

function Paused({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement | null {
  const { playerState } = useContext(PlayerContext);
  const isPlaying = playerState === "playing";
  if (isPlaying) {
    return null;
  }
  return <>{children}</>;
}

type PlayButtonComponent = React.FC<PlayButtonProps> & {
  Playing: typeof Playing;
  Paused: typeof Paused;
};

PlayButtonComponent.Playing = Playing;
PlayButtonComponent.Paused = Paused;
PlayButtonComponent.PlayButton = PlayButtonComponent;

export const PlayButton = PlayButtonComponent;
