import { useAudioElement } from "../AudioElement/useAudioElement";

export function useVolumeAriaAttributes() {
  const { volume } = useAudioElement();
  return {
    "aria-label": "Adjust volume",
    "aria-valuemin": 0,
    "aria-valuemax": 1,
    "aria-valuenow": volume,
    "aria-valuetext": `Volume ${Math.round(volume * 100)}%`,
  };
}
