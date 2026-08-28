import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useIsDisabled, usePlayerState } from "../store/derived";
import { usePlayerStore } from "../store/PlayerStoreContext";

type PlayButtonProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

// The name carries the state, and `aria-pressed` is deliberately absent: a
// name that already says "Pause audio" plus `aria-pressed="true"` announced the
// same fact twice, in two vocabularies. The name also reaches further than a
// boolean can -- `loading` and `error` are states `aria-pressed` cannot express.
const ariaLabelMap = {
  playing: "Pause audio",
  paused: "Play audio",
  loading: "Loading audio",
  error: "Error loading audio",
};

function PlayButtonComponent({ children, ...props }: PlayButtonProps) {
  const { isDisabled, ariaLabel } = usePlayButtonProps();
  const handleKeyDown = useHandleMediaKeys();
  const handleClick = useHandleClick();

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Reads no state: `TOGGLE_PLAY` already branches on `el.paused`, so a
 * `playerState` check here would be a second, staler copy of that decision.
 */
function useHandleClick() {
  const { send } = usePlayerStore();
  return () => send({ type: "TOGGLE_PLAY" });
}

function usePlayButtonProps() {
  const playerState = usePlayerState();
  const isDisabled = useIsDisabled();
  const ariaLabel = ariaLabelMap[playerState];
  return { isDisabled, ariaLabel };
}

function Playing({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement | null {
  const isPlaying = usePlayerState() === "playing";
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
  const isPlaying = usePlayerState() === "playing";
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

export const PlayButton = PlayButtonComponent;
