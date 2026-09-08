import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { usePlayerState } from "../store/derived";
import { useDisabledButtonProps } from "../Shared/useDisabledButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type PlayButtonProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

// Four names, not a play/pause pair: the name is the button's only state
// channel, so it has to carry `loading` and `error` too (A4).
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

/** Renders `children` only while the element is playing. */
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

/**
 * Renders `children` whenever the element is **not** playing — including loading
 * and errored, not only paused. The pair is exhaustive, so a button using both
 * always shows an icon. To tell the other states apart, read
 * `useAudioPlayer().playerState`.
 */
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

/**
 * Play/pause, as one button.
 *
 * The accessible name is the only place its state appears — "Play audio", "Pause
 * audio", "Loading audio" or "Error loading audio". It sets no `aria-pressed`;
 * pass your own `aria-label` to override.
 *
 * Pressable while loading: `play()` before metadata is legal and the browser
 * queues it. Only an error disables it, with `aria-disabled` rather than the
 * native attribute — so style it from `[aria-disabled="true"]`, not
 * `:disabled`. An autoplay refusal does not disable it; read that with
 * `useAudioError()`.
 */
export const PlayButton = PlayButtonComponent;
