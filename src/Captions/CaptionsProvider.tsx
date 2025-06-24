import { memo, useCallback, useState } from "react";
import { CaptionsContext } from "./CaptionsContext";
import { useAudioContext } from "../AudioElement/AudioContext";

export const CaptionsProvider = memo(function CaptionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cues, setCues] = useState<VTTCue[]>([]);
  const { captionsCallbackRef } = useAudioContext();
  const [showCaptions, setShowCaptions] = useState(true);
  captionsCallbackRef.current.handleCueChange = useCallback(
    (cues: VTTCue[]) => {
      setCues(cues);
    },
    [setCues],
  );

  return (
    <CaptionsContext.Provider
      value={{
        cues,
        showCaptions,
        setShowCaptions,
        setCues,
      }}
    >
      {children}
    </CaptionsContext.Provider>
  );
});
