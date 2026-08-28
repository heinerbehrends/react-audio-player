import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { usePlayerState } from "../store/derived";
import { useDisabledButtonProps } from "../Shared/useDisabledButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type PlayButtonProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

// State is on the name only; `aria-pressed` beside it announced the same fact
// twice. The name also carries `loading` and `error`, which a boolean cannot.
const ariaLabelMap = {
  playing: "Pause audio",
  paused: "Play audio",
  loading: "Loading audio",
  error: "Error loading audio",
};

function PlayButtonComponent({ children, ...props }: PlayButtonProps) {
  const ariaLabel = useAriaLabel();
  const handleKeyDown = useHandleMediaKeys();
  const handleClick = useHandleClick();
  const disabled = useDisabledButtonProps(handleClick, props.onClick);

  return (
    <button
      type="button"
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      {...props}
      // Last, so the gate cannot be spread away.
      {...disabled}
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

function useAriaLabel() {
  return ariaLabelMap[usePlayerState()];
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
