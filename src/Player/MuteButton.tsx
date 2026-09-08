import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useVolumeState } from "../store/derived";
import { useDisabledButtonProps } from "../Shared/useDisabledButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type MuteButtonComponentProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function MuteButtonComponent({
  children,
  ...props
}: MuteButtonComponentProps) {
  const volumeState = useVolumeState();
  const toggleMute = useToggleMute();
  const handleMediaKeys = useHandleMediaKeys();
  const disabled = useDisabledButtonProps(toggleMute, props.onClick);

  return (
    <button
      type="button"
      // No `aria-pressed` beside this, deliberately: with both, a screen
      // reader announced "Unmute, toggle button, pressed" — the name says the
      // button will unmute, the state says it already has (A4). `PlaybackRate.Set`
      // does carry it, because its name does not move.
      aria-label={volumeState === "muted" ? "Unmute" : "Mute"}
      onKeyDown={handleMediaKeys}
      {...props}
      // Last, so the gate cannot be spread away.
      {...disabled}
    >
      {children}
    </button>
  );
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
