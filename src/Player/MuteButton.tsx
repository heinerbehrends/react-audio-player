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
      // State is on the name only. With `aria-pressed` as well it announced
      // "Unmute, toggle button, pressed": the name says the button will
      // unmute, the state says it already is.
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

function Muted({ children }: MutedProps): React.ReactElement | null {
  const volumeState = useVolumeState();
  if (volumeState !== "muted") return null;
  return <>{children}</>;
}

type LowVolumeProps = {
  children: React.ReactNode;
};

function LowVolume({ children }: LowVolumeProps): React.ReactElement | null {
  const volumeState = useVolumeState();
  if (volumeState !== "low") return null;
  return <>{children}</>;
}

type HighVolumeProps = {
  children: React.ReactNode;
};

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
export const MuteButton = MuteButtonComponent as MuteButtonComponent;
