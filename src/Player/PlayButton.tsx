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
 * Renders `children` whenever the element is **not** playing — which includes
 * loading and errored, not only paused. The pair is exhaustive by design, so a
 * button built from `.Playing` and `.Paused` always has an icon; if you want to
 * distinguish the other two states, branch on `useAudioPlayer().playerState`.
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
 * Play/pause, as one button. Its accessible name is the only place its state
 * appears — "Play audio", "Pause audio", "Loading audio" or "Error loading
 * audio" — and it deliberately sets no `aria-pressed`; pass your own
 * `aria-label` to override or localise.
 *
 * Pressable while the track is still loading: `play()` before metadata is legal
 * and the browser queues it. Only an error marks it unavailable, and then with
 * `aria-disabled`, never the native `disabled` attribute — so style that state
 * from `[aria-disabled="true"]`, not `:disabled`. While it is set, activation
 * does nothing, your own `onClick` included.
 *
 * An autoplay refusal is not an error in this sense: the controls stay live,
 * because a user gesture is what lifts it. Read it with `useAudioError()`.
 */
export const PlayButton = PlayButtonComponent;
