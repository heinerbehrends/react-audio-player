/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { useVolumeState } from "../store/derived";
import {
  useComposedButtonProps,
  type ButtonPropsBag,
} from "../Shared/useComposedButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type MuteButtonComponentProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * `MuteButton`'s props, for a `<button>` of your own: the "Mute"/"Unmute" name,
 * the toggle, the error gate and the media keys.
 *
 * Spread it last, onto a `<button>` or a component that renders one. Pass your
 * handlers in rather than adding them after the spread, where the library
 * cannot compose them.
 */
export function useMuteButtonProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(props?: P): ButtonPropsBag<P> {
  const volumeState = useVolumeState();
  const toggleMute = useToggleMute();
  const composed = useComposedButtonProps(toggleMute, props ?? {});

  // Asserted: TypeScript cannot prove a spread of a generic `P` is the bag.
  return {
    type: "button",
    // No `aria-pressed` beside this, deliberately: with both, a screen reader
    // announced "Unmute, toggle button, pressed" — the name says the button
    // will unmute, the state says it already has (A4).
    "aria-label": volumeState === "muted" ? "Unmute" : "Mute",
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as ButtonPropsBag<P>;
}

export function MuteButtonComponent({
  children,
  ...props
}: MuteButtonComponentProps) {
  return <button {...useMuteButtonProps(props)}>{children}</button>;
}

type MutedProps = {
  children: React.ReactNode;
};

function useToggleMute() {
  const { send } = usePlayerStore();
  return () => send({ type: "TOGGLE_MUTE" });
}

/**
 * Renders `children` while the player is silent: muted, or within 0.001 of zero
 * volume — a slider dragged to the end rarely lands on exactly 0.
 */
function Muted({ children }: MutedProps): React.ReactElement | null {
  const volumeState = useVolumeState();
  if (volumeState !== "muted") return null;
  return <>{children}</>;
}

type LowVolumeProps = {
  children: React.ReactNode;
};

/** Renders `children` while audible and below 0.5. */
function LowVolume({ children }: LowVolumeProps): React.ReactElement | null {
  const volumeState = useVolumeState();
  if (volumeState !== "low") return null;
  return <>{children}</>;
}

type HighVolumeProps = {
  children: React.ReactNode;
};

/**
 * Renders `children` while audible and at or above 0.5, which counts as high.
 * The three parts are mutually exclusive and exhaustive, so a button using all
 * three always shows exactly one icon.
 */
function HighVolume({ children }: HighVolumeProps): React.ReactElement | null {
  const volumeState = useVolumeState();
  if (volumeState !== "high") return null;
  return <>{children}</>;
}

type MuteButtonComponent = React.FC<MuteButtonComponentProps> & {
  Muted: typeof Muted;
  LowVolume: typeof LowVolume;
  HighVolume: typeof HighVolume;
};

MuteButtonComponent.Muted = Muted;
MuteButtonComponent.LowVolume = LowVolume;
MuteButtonComponent.HighVolume = HighVolume;
/**
 * Mute/unmute. Named "Mute" or "Unmute" for what pressing it will do, and that
 * name is the only place the state appears — no `aria-pressed`. Pass your own
 * `aria-label` to override.
 *
 * Unmuting restores the volume the player was last audible at: mute at 80 % and
 * unmuting returns to 80 %, not to full.
 *
 * Live while loading — `muted` is settable before metadata. Only an error
 * disables it, via `aria-disabled`.
 */
export const MuteButton = MuteButtonComponent as MuteButtonComponent;
