/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { usePlayerState, type PlayerState } from "../store/derived";
import {
  useComposedButtonProps,
  type StatefulButtonPropsBag,
} from "../Shared/useComposedButtonProps";
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

/**
 * `PlayButton`'s props, for a `<button>` of your own: the four-name label (A4),
 * play/pause, the error gate and the media keys.
 *
 * Spread it last, onto a `<button>`, and pass your own handlers in the call —
 * after the spread they replace the library's rather than composing with it.
 */
export function usePlayButtonProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(props?: P): StatefulButtonPropsBag<P, PlayerState> {
  const playerState = usePlayerState();
  const handleClick = useHandleClick();
  const composed = useComposedButtonProps(handleClick, props ?? {});

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  return {
    type: "button",
    "data-part": "play",
    "data-state": playerState,
    "aria-label": ariaLabelMap[playerState],
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as StatefulButtonPropsBag<P, PlayerState>;
}

function PlayButtonComponent({ children, ...props }: PlayButtonProps) {
  return <button {...usePlayButtonProps(props)}>{children}</button>;
}

/**
 * Reads no state: `TOGGLE_PLAY` already branches on `el.paused`, so a
 * `playerState` check here would be a second, staler copy of that decision.
 */
function useHandleClick() {
  const { send } = usePlayerStore();
  return () => send({ type: "TOGGLE_PLAY" });
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
 * audio", "Loading audio" or "Error loading audio". No `aria-pressed` (A4); pass
 * your own `aria-label` to override.
 *
 * Pressable while loading: `play()` before metadata is legal and the browser
 * queues it. Only an error disables it, with `aria-disabled` rather than the
 * native attribute — so style that from `[aria-disabled="true"]`, not
 * `:disabled`. An autoplay refusal does not disable it; read it with
 * `useAudioError()`.
 *
 * Carries `data-part="play"` and `data-state="playing|paused|loading|error"`.
 */
export const PlayButton = PlayButtonComponent;
