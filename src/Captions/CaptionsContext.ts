import { createContext, useContext } from "react";

export type CaptionsCallbacks = {
  handleCueChange: (cues: VTTCue[]) => void;
};

export type CaptionsContextType = {
  cues: VTTCue[];
  showCaptions: boolean;
  setCues: (cues: VTTCue[]) => void;
  setShowCaptions: (show: boolean) => void;
};

const defaultContext: CaptionsContextType = {
  cues: [],
  showCaptions: true,
  setShowCaptions: () => {},
  setCues: () => {},
};

export const CaptionsContext =
  createContext<CaptionsContextType>(defaultContext);

export function useCaptionsContext() {
  const context = useContext(CaptionsContext);
  if (!context) {
    throw new Error("CaptionsContext must be used within a CaptionsProvider");
  }
  return context;
}
