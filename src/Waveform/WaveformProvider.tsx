import { useState } from "react";
import { WaveformContext } from "./WaveformContext";
import { useWaveform } from "./useWaveform";

export function WaveformProvider({
  children,
  nrOfPoints,
}: {
  children: React.ReactNode;
  nrOfPoints: number;
}) {
  const [waveformState, setWaveformState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [waveform, setWaveform] = useState<number[]>([]);
  console.log("waveform", waveform);
  useWaveform(nrOfPoints);
  return (
    <WaveformContext.Provider
      value={{ waveformState, setWaveformState, waveform, setWaveform }}
    >
      {children}
    </WaveformContext.Provider>
  );
}
