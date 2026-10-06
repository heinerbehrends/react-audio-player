/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { forwardRef } from "react";
import { useVolumeState, type VolumeState } from "../store/derived";
import {
  useComposedButtonProps,
  type StatefulButtonPropsBag,
} from "../Shared/useComposedButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useLabels } from "./PlayerConfigContext";

type MuteButtonComponentProps = {
  /** The button's content, such as `MuteButton.Muted` and `MuteButton.HighVolume`. */
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * `MuteButton`'s props for a `<button>` of your own: the name, the click, the
 * error gate and the keyboard shortcuts. Pass your props in the call and spread
 * the result last.
 */
export function useMuteButtonProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(props?: P): StatefulButtonPropsBag<P, VolumeState> {
  const volumeState = useVolumeState();
  const labels = useLabels();
  const toggleMute = useToggleMute();
  const composed = useComposedButtonProps(toggleMute, props ?? {});

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  return {
    type: "button",
    "data-part": "mute",
    "data-state": volumeState,
    // No `aria-pressed` beside this: with both, a screen reader announced
    // "Unmute, toggle button, pressed" — the name says the button will unmute,
    // the state says it already has (A4).
    "aria-label":
      labels?.mute?.[volumeState] ??
      (volumeState === "muted" ? "Unmute" : "Mute"),
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as StatefulButtonPropsBag<P, VolumeState>;
}

const MuteButtonRoot = /* @__PURE__ */ forwardRef<
  HTMLButtonElement,
  MuteButtonComponentProps
>(function MuteButton({ children, ...props }, ref) {
  return (
    <button {...useMuteButtonProps(props)} ref={ref}>
      {children}
    </button>
  );
});

type MutedProps = {
  children: React.ReactNode;
};

function useToggleMute() {
  const { send } = usePlayerStore();
  return () => send({ type: "TOGGLE_MUTE" });
}

/** Renders `children` while muted, or while the volume is within 0.001 of zero. */
function Muted({ children }: MutedProps): React.ReactElement | null {
  const volumeState = useVolumeState();
  if (volumeState !== "muted") return null;
  return <>{children}</>;
}

type LowVolumeProps = {
  children: React.ReactNode;
};

/** Renders `children` while audible and below half volume. */
function LowVolume({ children }: LowVolumeProps): React.ReactElement | null {
  const volumeState = useVolumeState();
  if (volumeState !== "low") return null;
  return <>{children}</>;
}

type HighVolumeProps = {
  children: React.ReactNode;
};

/**
 * Renders `children` while audible at half volume or above. The three parts
 * together always show exactly one.
 */
function HighVolume({ children }: HighVolumeProps): React.ReactElement | null {
  const volumeState = useVolumeState();
  if (volumeState !== "high") return null;
  return <>{children}</>;
}

type MuteButtonComponent = React.ForwardRefExoticComponent<
  MuteButtonComponentProps & React.RefAttributes<HTMLButtonElement>
> & {
  Muted: typeof Muted;
  LowVolume: typeof LowVolume;
  HighVolume: typeof HighVolume;
};

/**
 * Mutes and unmutes. Renders a `<button>` named "Mute" or "Unmute" for what
 * pressing does; the name is where the state is announced, so there is no
 * `aria-pressed`. Unmuting restores the last audible volume. Only an error
 * disables it, with `aria-disabled`. Carries `data-part="mute"` and
 * `data-state="muted" | "low" | "high"`.
 */
export const MuteButton: MuteButtonComponent = /* @__PURE__ */ Object.assign(
  MuteButtonRoot,
  { Muted, LowVolume, HighVolume },
);
