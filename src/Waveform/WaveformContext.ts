import { createContext, useContext } from "react";

export type WaveformContextType = {
  waveformState: "loading" | "ready" | "error";
  setWaveformState: (waveformState: "loading" | "ready" | "error") => void;
  waveform: number[];
  setWaveform: (waveform: number[]) => void;
};

export const WaveformContext = createContext<WaveformContextType>({
  waveformState: "loading",
  setWaveformState: () => {},
  waveform: [],
  setWaveform: () => {},
});

export function useWaveformContext() {
  const context = useContext(WaveformContext);
  if (!context) {
    throw new Error(
      "useWaveformContext must be used within a WaveformProvider",
    );
  }
  return context;
}
