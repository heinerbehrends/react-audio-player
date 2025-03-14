import { useState } from "react";
import { AudioContext, handleSideEffect } from "./AudioContext";

export function AudioContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  return (
    <AudioContext.Provider
      value={{
        audioElement,
        setAudioElement,
        handleSideEffect,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
