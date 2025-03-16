import { useState, useMemo } from "react";
import { AudioContext } from "./AudioContext";
import { handleSideEffect } from "./handleSideEffect";

export function AudioContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );

  const contextValue = useMemo(
    () => ({
      audioElement,
      setAudioElement,
      handleSideEffect,
    }),
    [audioElement]
  );

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}
