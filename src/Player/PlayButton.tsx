/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { forwardRef } from "react";
import { usePlayerState, type PlayerState } from "../store/derived";
import {
  useComposedButtonProps,
  type StatefulButtonPropsBag,
} from "../Shared/useComposedButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useLabels } from "./PlayerConfigContext";

type PlayButtonProps = {
  /** The button's content, such as `PlayButton.Playing` and `PlayButton.Paused`. */
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
 * `PlayButton`'s props for a `<button>` of your own: the name, the click, the
 * error gate and the keyboard shortcuts. Pass your props in the call and spread
 * the result last.
 */
export function usePlayButtonProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(props?: P): StatefulButtonPropsBag<P, PlayerState> {
  const playerState = usePlayerState();
  const labels = useLabels();
  const handleClick = useHandleClick();
  const composed = useComposedButtonProps(handleClick, props ?? {});

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  return {
    type: "button",
    "data-part": "play",
    "data-state": playerState,
    "aria-label": labels?.play?.[playerState] ?? ariaLabelMap[playerState],
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as StatefulButtonPropsBag<P, PlayerState>;
}

const PlayButtonRoot = /* @__PURE__ */ forwardRef<
  HTMLButtonElement,
  PlayButtonProps
>(function PlayButton({ children, ...props }, ref) {
  return (
    <button {...usePlayButtonProps(props)} ref={ref}>
      {children}
    </button>
  );
});

/**
 * Reads no state: `toggle` already branches on `el.paused`, so a
 * `playerState` check here would be a second, staler copy of that decision.
 */
function useHandleClick() {
  return usePlayerStore().controls.toggle;
}

/** Renders `children` while playing. */
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
 * Renders `children` while not playing: paused, loading or errored. To tell
 * those apart, read `useAudioPlayer().playerState`.
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

type PlayButtonComponent = React.ForwardRefExoticComponent<
  PlayButtonProps & React.RefAttributes<HTMLButtonElement>
> & {
  Playing: typeof Playing;
  Paused: typeof Paused;
};

/**
 * Plays and pauses. Renders a `<button>` named "Play audio", "Pause audio",
 * "Loading audio" or "Error loading audio"; the name is where the state is
 * announced, so there is no `aria-pressed`. Pressable while loading; only an
 * error disables it, with `aria-disabled`. Carries `data-part="play"` and
 * `data-state="playing" | "paused" | "loading" | "error"`.
 */
export const PlayButton: PlayButtonComponent = /* @__PURE__ */ Object.assign(
  PlayButtonRoot,
  { Playing, Paused },
);
