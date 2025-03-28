import { useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { handleMediaKeys } from "../handleKeys";

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
  const {
    handlePlayerAction,
    player: state,
    getPlayerState,
  } = useContext(PlayerContext);
  const isPlaying = state === "playing";
  return (
    <button
      onClick={() => {
        handlePlayerAction({ type: "TOGGLE_PLAY" });
      }}
      onKeyDown={(event) => {
        handleMediaKeys({
          event,
          handlePlayerAction,
          getPlayerState,
        });
      }}
      disabled={state === "loading"}
      aria-label={ariaLabel[state]}
      aria-pressed={isPlaying}
      {...props}
    >
      {children}
    </button>
  );
}

function Playing({ children }: { children: React.ReactNode }) {
  const { player: state } = useContext(PlayerContext);
  if (state !== "playing") {
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
