import { useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { handleMediaKeys } from "../TimelineVolume/handleKeys";
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
  const { dispatch, player: state } = useContext(PlayerContext);
  const { handleSideEffect, audioElement } = useContext(AudioContext);
  const isPlaying = state === "playing";
  return (
    <button
      onClick={() => {
        handleSideEffect({ type: "TOGGLE_PLAY" }, audioElement);
        dispatch({ type: "TOGGLE_PLAY" });
      }}
      onKeyDown={(event) => {
        handleMediaKeys({
          event,
          handleSideEffect,
          audioElement,
          dispatchPlayer: dispatch,
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

export default PlayButtonComponent;
